import { formatApiUrl } from "@/lib/utils";
import type { UserData } from "@/types/user";

export async function getUserData(login: string): Promise<UserData> {
  const res = await fetch(formatApiUrl(`/get-user/${login}`), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch user data");
  return res.json();
}
