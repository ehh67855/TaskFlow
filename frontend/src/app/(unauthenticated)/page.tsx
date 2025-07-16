import { getAuthToken, getLogin } from "@/services/BackendService";
import { redirect } from "next/navigation";
import { LandingPageClient } from "./landing.client";

export default async function LandingPage() {
  const authToken = await getAuthToken();
  const userLogin = await getLogin(authToken);
  if (userLogin) {
    redirect("/home");
  }

  return <LandingPageClient />;
}
