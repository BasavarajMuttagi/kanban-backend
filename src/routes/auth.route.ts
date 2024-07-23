import express from "express";
import { validate } from "../middlewares/validate.middleware";
import {
  GoogleAuth,
  GoogleAuthCallback,
  LoginUser,
  SignUpUser,
} from "../controllers/auth.controller";
import { userLoginSchema, userSignUpSchema } from "../zod/schema";

const AuthRouter = express.Router();

AuthRouter.post("/signup", validate(userSignUpSchema), SignUpUser);
AuthRouter.post("/login", validate(userLoginSchema), LoginUser);
AuthRouter.get("/google", GoogleAuth);
AuthRouter.get("/google/callback", GoogleAuthCallback);

export default AuthRouter;
