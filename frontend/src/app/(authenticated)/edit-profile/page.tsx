import { Suspense } from "react";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { EditProfileForm } from "./edit-profile-form";
import { getUserData } from "./data";
import { redirect } from "next/navigation";
import { PageTemplate } from "@/components/page-template";
import { type Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { SessionExpiredError } from "@/lib/session-errors";
import type { UserData } from "@/types/user";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default async function EditProfilePage() {
  const token = await getAuthToken();

  // This page fetches the same user data the (authenticated) layout already fetches and
  // guards - duplicated rather than reading it back out of the layout, since Next.js doesn't
  // give a page access to its layout's already-fetched data. That means a bad/expired token
  // needs the exact same handling here too, or this page's own fetch throws before the
  // layout's redirect ever takes effect. The stale cookie itself is left alone (not cleared) -
  // see the matching comment in (authenticated)/layout.tsx for why.
  let userLogin: string | undefined;
  try {
    userLogin = await getLogin(token);
  } catch {
    redirect("/login?expired=1");
  }
  if (!userLogin) {
    redirect("/login");
  }

  let userData: UserData;
  try {
    userData = await getUserData(userLogin);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      redirect("/login?expired=1");
    }
    throw error;
  }

  return (
    <PageTemplate name="Edit Profile">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="sm:w-1/2 flex flex-col mx-auto">
          <Card className="p-4">
            <EditProfileForm initialData={userData} userLogin={userLogin} />
          </Card>
        </div>
      </Suspense>
    </PageTemplate>
  );
}
