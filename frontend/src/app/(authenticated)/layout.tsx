import { getAuthToken, getLogin } from "@/services/BackendService";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserData } from "./edit-profile/data";

export default async function AuthenticatedLayoutWithSidebar(
  props: RootLayoutProps
) {
  const authToken = await getAuthToken();
  if (!authToken) {
    return redirect("/login");
  }

  const userLogin = await getLogin(authToken);
  if (!userLogin) {
    return redirect("/login");
  }

  const userData = await getUserData(userLogin);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: `${userData.firstName} ${userData.lastName}`,
        }}
      />
      <SidebarInset>{props.children}</SidebarInset>
    </SidebarProvider>
  );
}
