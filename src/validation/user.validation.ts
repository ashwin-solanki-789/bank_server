import { object, string } from "yup";

export const registerInputSchema = object({
  firstname: string().required("Firstname cannot be empyt"),
  lastname: string().required("Lastname cannot be empyt"),
  password: string()
    .required("Password cannot be empty!")
    .min(6, "Password is too short!")
    .max(18, "Password is too long!"),
  email: string().required("Email cannot be empty!").email("Invalid email ID!"),
  tax_id: string().required("Tax ID cannot be empty!"),
});

export const loginInputSchema = object({
  email: string().required("Tax ID cannot be empty!"),
  password: string().required("Password cannot be empty"),
});
