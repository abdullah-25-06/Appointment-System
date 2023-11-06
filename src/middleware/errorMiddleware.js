import CustomErrorApi from "../error/error.js";
export const error = (err, req, res, next) => {
  if (err instanceof CustomErrorApi) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  return res.status(500).json("Couldn't process the request");
};
