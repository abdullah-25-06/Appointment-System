import CustomErrorApi from "../error/error.js";
import { verify } from '../utils/jwt.js';
import asyncHandler from "express-async-handler";
import userModel from "../models/user.js";

const Auth = asyncHandler(async (req, res, next) => {
  
  const token = req.header("Authorization").replace("Bearer ", "");
  
  const decode = verify(token);
  
  const user = await userModel.findOne({ _id: decode.id, token: token }).select(
    "-password"
  );
  if (!user) {
    throw new CustomErrorApi("Login failed, Please login again", 401);
  }
  req.user = { id: user._id, name: user.name, email: user.email };
  next();
});

export default Auth
