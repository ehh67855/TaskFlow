import { type Metadata } from "next";
import ForgotPasswordForm from "./form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
