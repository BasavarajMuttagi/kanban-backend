import { z } from "zod";

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "password cannot be less than 8 digits" })
    .max(10, { message: "password cannot be more than 10 digits" }),
});

type userLoginType = z.infer<typeof userLoginSchema>;

const userSignUpSchema = z
  .object({
    firstname: z.string().min(1, { message: "first name is required" }),
    lastname: z.string().min(1, { message: "last name is required" }),
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: "password cannot be less than 8 digits" })
      .max(10, { message: "password cannot be more than 10 digits" }),
    confirmpassword: z
      .string()
      .min(8, { message: "password cannot be less than 8 digits" })
      .max(10, { message: "password cannot be more than 10 digits" }),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "Passwords don't match",
    path: ["confirmpassword"],
  });

type userSignUpType = z.infer<typeof userSignUpSchema>;
export type { userLoginType, userSignUpType };
export { userLoginSchema, userSignUpSchema };
