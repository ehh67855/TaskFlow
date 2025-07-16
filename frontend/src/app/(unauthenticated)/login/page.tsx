import { type Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <LoginForm />;
}
