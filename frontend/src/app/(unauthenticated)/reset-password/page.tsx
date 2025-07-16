import { type Metadata } from "next";
import ResetPasswordForm from "./form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
