import { Suspense } from "react";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { EditProfileForm } from "./edit-profile-form";
import { getUserData } from "./data";
import { redirect } from "next/navigation";
import { PageTemplate } from "@/components/page-template";
import { type Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default async function EditProfilePage() {
  const token = await getAuthToken();
  const userLogin = await getLogin(token);
  if (!userLogin) {
    redirect("/login");
  }

  const userData = await getUserData(userLogin);

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
