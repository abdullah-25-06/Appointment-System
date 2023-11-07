import jwt from "jsonwebtoken";
import CustomErrorApi from "../error/error.js";
import crypto from "crypto";

const generateAuthToken = (user) => {
  const { id, email } = user;
  const jti = crypto.randomBytes(32).toString("hex");

  var access_token = jwt.sign({ id, email }, process.env.access_key, {
    expiresIn: "2d",
    jwtid: jti,
  });

  var refresh_token = jwt.sign({ id, email }, process.env.refresh_key, {
    expiresIn: "7d",
  });

  return {
    access_token: access_token,
    refresh_token: refresh_token,
    jti,
  };
};

const verify = (token) => {
  console.log("verify");
  const decode = jwt.verify(token, process.env.access_key);
  console.log("verify");
  if (!decode) {
    throw new CustomErrorApi("Login again ", 400);
  }
  console.log("verify");
  return decode;
};
export { verify, generateAuthToken };
