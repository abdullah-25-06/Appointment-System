import userModel from "../models/user.js";
import JwtStrategy from "passport-jwt/lib/strategy.js";
import ExtractJwt from "passport-jwt/lib/extract_jwt.js";

const option = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.access_key,
  algorithms: ["HS256"],
};

const strategy = new JwtStrategy(option, (payload, done) => {
  userModel
    .findOne({ _id: payload.id })
    .select("-password -avatar")
    .then((user) => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch((err) => done(err, null));
});

const passportConfig = (passport) => {
  passport.use(strategy);
};
export default passportConfig;
