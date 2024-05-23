import { object, string } from "yup";

export const registerInputSchema = object({
  firstname: string().required("Firstname cannot be empyt"),
  password: string()
    .required("Password cannot be empty!")
    .min(6, "Password is too short!")
    .max(18, "Password is too long!"),
  tax_id: string().required("Tax ID canno be empty!"),
});

export const loginInputSchema = object({
  tax_id: string().required("Tax ID cannot be empty!"),
  password: string().required("Password cannot be empty"),
});
