import { NextFunction, Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_BASE_URL, SECRET_SALT } from "../..";
import { userLoginType, userSignUpType } from "../zod/schema";
import { User } from "../models/models";
import passport from "passport";

const SignUpUser = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, password } = req.body as userSignUpType;
    const isUserExists = await User.exists({ email });
    if (isUserExists) {
      res.status(409).send({ message: "Account Exists!" });
      return;
    }
    const encryprtedPassword = await bcrypt.hash(password, 10);
    const record = await User.create({
      firstname,
      lastname,
      email,
      password: encryprtedPassword,
    });
    res.status(201).send({ message: "Account Created SuccessFully!", record });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error Occured , Please Try Again!", error });
  }
};

const LoginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as userLoginType;
    const UserRecord = await User.findOne({
      email,
    });
    if (!UserRecord) {
      res.status(409).send({ message: "User Not Found!" });
      return;
    }
    const fullname = `${UserRecord.firstname} ${UserRecord.lastname}`;
    const isPasswordMatch = await bcrypt.compare(
      password,
      UserRecord.password as string,
    );
    if (!isPasswordMatch) {
      res.status(400).send({ message: "email or password incorrect" });
      return;
    }
    const token = sign(
      {
        userId: UserRecord.id,
        email: UserRecord.email,
        name: fullname,
      },
      SECRET_SALT,
      { expiresIn: "24h" },
    );
    res.status(200).send({
      user: {
        fullname,
      },
      token: token,
      message: "success",
    });
  } catch (error) {
    res.status(500).send({ message: "Error Occured , Please Try Again!" });
  }
};

const GoogleAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
};

const GoogleAuthCallback = (req: Request, res: Response) => {
  passport.authenticate(
    "google",
    { failureRedirect: APP_BASE_URL + "/login" },
    async (err, user) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect(APP_BASE_URL + "/login");
      }
      if (!user) {
        return res.redirect(APP_BASE_URL + "/login");
      }

      // Generate a JWT token
      const token = sign(
        {
          userId: user._id,
          email: user.email,
          name: `${user.firstname} ${user.lastname}`,
        },
        SECRET_SALT,
        { expiresIn: "24h" },
      );

      // Redirect to the specified URL with the token
      const redirectUrl = `${APP_BASE_URL}/redirect?token=${token}`;
      return res.redirect(redirectUrl);
    },
  )(req, res);
};
export { SignUpUser, LoginUser, GoogleAuth, GoogleAuthCallback };
