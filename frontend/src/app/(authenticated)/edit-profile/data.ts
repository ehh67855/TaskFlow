import { formatApiUrl } from "@/lib/utils";
import type { UserData } from "@/types/user";
import { getAuthToken } from "@/services/BackendService";

export async function getUserData(login: string): Promise<UserData> {
  const token = await getAuthToken();
  const res = await fetch(formatApiUrl(`/get-user/${login}`), {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch user data");
  return res.json();
}
