import Router from "express";
import { Login, Logout, Register, me } from "../controller/user.js";
import Auth from "../middleware/checkAuth.js";
import passport from "passport";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const user_router = Router();
user_router.route("/login").post(Login);
user_router
  .route("/me")
  .get(passport.authenticate("jwt", { session: false }), me)
  .patch(
    passport.authenticate("jwt", { session: false }),
    upload.single("avatar"),
    me
  );
user_router.route("/register").post(upload.single("avatar"), Register);
user_router.route("/logout").post(Logout);

export default user_router;
