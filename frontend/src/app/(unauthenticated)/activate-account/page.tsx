import { type Metadata } from "next";
import ActivateAccountForm from "./form";

export const metadata: Metadata = {
  title: "Activate Account",
};

export default function ActivateAccountPage() {
  return <ActivateAccountForm />;
}
