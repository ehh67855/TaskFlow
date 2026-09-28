import { getAuthToken, getLogin } from "@/services/BackendService";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { BadgeUnlockNotification } from "@/components/badge-unlock-notification";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserData } from "./edit-profile/data";
import { SessionExpiredError } from "@/lib/session-errors";
import type { UserData } from "@/types/user";

export default async function AuthenticatedLayoutWithSidebar(
  props: RootLayoutProps
) {
  const authToken = await getAuthToken();
  if (!authToken) {
    return redirect("/login");
  }

  // getLogin decodes the JWT client-side (jwt-decode doesn't check signature/expiry, just
  // parses the payload) - a cookie holding a corrupted or non-JWT value throws here rather
  // than returning undefined, before the token's actual expiry is ever checked against the
  // backend below. Not cleared here - Next.js only allows cookie writes from a Server Action
  // or Route Handler, not mid-render in a Server Component like this layout - so the stale
  // cookie is simply left in place and every request just keeps redirecting back to login
  // until the real login form submission (a genuine Server Action call) overwrites it.
  let userLogin: string | undefined;
  try {
    userLogin = await getLogin(authToken);
  } catch {
    redirect("/login?expired=1");
  }
  if (!userLogin) {
    return redirect("/login");
  }

  // A token that's still present but expired/invalid (the common case: it just outlived its
  // 1-day validity - see UserAuthenticationProvider.createToken) reaches here as a thrown
  // SessionExpiredError rather than a valid response.
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
    <SidebarProvider>
      <AppSidebar
        user={{
          name: `${userData.firstName} ${userData.lastName}`,
          profilePicture: userData.profilePicture,
        }}
      />
      <SidebarInset>{props.children}</SidebarInset>
      <BadgeUnlockNotification />
    </SidebarProvider>
  );
}
