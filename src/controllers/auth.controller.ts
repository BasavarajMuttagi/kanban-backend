import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_BASE_URL, client, SECRET_SALT } from "../..";
import { userLoginType, userSignUpType } from "../zod/schema";
import { User } from "../models/models";
import { TokenPayload } from "google-auth-library";

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
    return res
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
      { expiresIn: "1h" },
    );
    res.status(200).send({
      user: {
        fullname,
        email: UserRecord.email,
      },
      token: token,
      message: "success",
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Error Occured , Please Try Again!" });
  }
};

const GoogleAuth = async (req: Request, res: Response) => {
  try {
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    return res.json({ authUrl });
  } catch (error) {
    res.status(500).send({ message: "Error Occurred, Please Try Again!" });
  }
};

const GoogleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    const { tokens } = await client.getToken(code as string);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const {
      email,
      given_name: firstname,
      family_name: lastname,
      sub: googleId,
    } = ticket.getPayload() as TokenPayload;

    let user = await User.findOne({ email });

    //if user doesn't exist
    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstname,
        lastname,
        authProvider: "google",
      });
    }

    //if user exists using email/password - upgrade to google
    if (user && !user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      await user.save();
    }

    const token = sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
      },
      SECRET_SALT,
      { expiresIn: "1h" },
    );

    return res.redirect(`${APP_BASE_URL}/redirect?token=${token}&success=true`);
  } catch (error) {
    console.error("Error during Google authentication:", error);
    return res.redirect(
      `${APP_BASE_URL}/redirect?success=false&error=${"Error during Google authentication:"}`,
    );
  }
};
export { SignUpUser, LoginUser, GoogleAuth, GoogleAuthCallback };
