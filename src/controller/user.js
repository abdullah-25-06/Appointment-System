import mongoose from "mongoose";
import userModel from "../models/user.js";
import asyncHandler from "express-async-handler";
import CustomErrorApi from "../error/error.js";
import { parsePhoneNumber } from "awesome-phonenumber";
import { generateAuthToken } from "../utils/jwt.js";
import bcrypt from "bcrypt";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.API_Key,
  api_secret: process.env.API_Key_Secret,
});

export const Register = asyncHandler(async (req, res) => {
  const { name, password, email, phone } = req.body;
  if (!email || !password || !name || !phone) {
    throw new CustomErrorApi(
      "Please Enter all name and email and password and phone number",
      400
    );
  }
  const checkUser = await userModel.findOne({ email });
  if (checkUser) {
    throw new CustomErrorApi("User already exists with same email", 400);
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  const pn = parsePhoneNumber(phone, { regionCode: "PK" });
  const session = await mongoose.startSession();
  session.startTransaction();
  const { public_id, url } = await cloudinary.uploader.upload(req.file.path);
  const user = await userModel.create({
    name,
    email,
    password: hashPassword,
    avatar: { public_id, url },
    phone: pn.number.e164,
  });

  const { access_token, refresh_token, jti } = generateAuthToken(user);
  const token = await userModel.updateOne(
    { _id: user._id },
    { token_detail: { access_token, jti } }
  );

  if (!token) {
    throw new CustomErrorApi("Try again to register", 400);
  }
  await session.commitTransaction();
  return res.status(200).json({ user, access_token, refresh_token });
});

export const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const { access_token, refresh_token, jti } = generateAuthToken(user);

    const token = await userModel.findByIdAndUpdate(
      { _id: user._id },
      { token_detail: { access_token, jti } }
    );

    return res.status(200).json({ access_token, refresh_token });
  }
  throw new CustomErrorApi("Invalid email or password", 400);
});

export const Logout = asyncHandler(async (req, res) => {
  const { id } = req.user;
  await userModel.findByIdAndUpdate(
    { _id: id },
    { token_detail: { access_token: null, jti: null } }
  );
  res.status(200).send({ message: "You have been logged out" });
});

export const me = asyncHandler(async (req, res, next) => {
  if (req.method === "GET") {
    const user = await userModel
      .findById({ _id: req.user.id })
      .select({ password: 0, token_detail: 0 });
    if (!user) {
      throw new CustomErrorApi("No User with this Email", 404);
    }
    return res.status(200).json({ user });
  }
  const { password, phone, newPassword } = req.body;
  const update = Object.keys(req.body);
  const update_ele = ["password", "avatar", "phone", "newPassword"];
  const isValid = update.every((item) => update_ele.includes(item));
  if (!isValid) {
    throw new CustomErrorApi(
      "You can only update password, avatar or phone number",
      404
    );
  }

  const user = await userModel.findOne({ _id: req.user.id });

  if (
    password &&
    (await bcrypt.compare(password, user.password)) &&
    newPassword
  ) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);
    await userModel.findByIdAndUpdate(
      { _id: req.user.id },
      { password: hashPassword }
    );
  }

  if (req.file) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
    await userModel.findByIdAndUpdate(
      { _id: req.user.id },
      { avatar: { public_id: null, url: null } }
    );
  }
  if (phone) {
    const pn = parsePhoneNumber(phone, { regionCode: "PK" });
    await userModel.findByIdAndUpdate({ _id: req.user.id }, { phone: pn });
  }
  return res.status(200).json({ message: "Updated successfully" });
});
