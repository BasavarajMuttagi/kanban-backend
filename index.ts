import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import BoardRouter from "./src/routes/board.route";
import AuthRouter from "./src/routes/auth.route";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { User } from "./src/models/models";
config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
export const SECRET_SALT = process.env.SECRET_SALT as string;
export const APP_BASE_URL = process.env.APP_BASE_URL as string;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${process.env.SERVER_BASE_URL as string}/auth/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const { emails, id, name } = profile;
        const email = emails![0].value;
        const user = await User.findOne({ email });

        //if user doesnt exit
        if (!user) {
          const user = await User.create({
            googleId: id,
            email: email,
            firstname: name?.givenName,
            lastname: name?.familyName,
            authProvider: "google",
          });

          return done(null, user);
        }
        //if user exist using email/password - upgrade to google
        if (!user.googleId) {
          user.googleId = id;
          user.authProvider = "google";
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error);
      }
    },
  ),
);

app.use(passport.initialize());
app.use("/auth", AuthRouter);
app.use("/board", BoardRouter);
app.get("/", (req, res) => {
  res.send("Express + TypeScript Servers");
});

async function main() {
  try {
    await connect(DATABASE_URL!).then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
      });
    });
  } catch (error) {
    console.log(error);
  }
}

main();
export default app;
