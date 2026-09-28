"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserPlus, UserCheck, UserX, Clock, Users as UsersIcon } from "lucide-react";
import { PageTemplate } from "@/components/page-template";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClipLoader } from "react-spinners";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { formatApiUrl } from "@/lib/utils";
import { useFriendActions } from "@/hooks/use-friend-actions";
import type { UserProfileData } from "@/types/user";

export default function ProfilePage() {
  const params = useParams();
  const targetLogin = params.login as string;
  const [viewerLogin, setViewerLogin] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentViewer: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(
        formatApiUrl(`/profile/${encodeURIComponent(targetLogin)}?login=${encodeURIComponent(currentViewer)}`),
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (res.ok) setProfile(await res.json());
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }, [targetLogin]);

  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      const currentViewer = await getLogin(token);
      if (!currentViewer) return;
      setViewerLogin(currentViewer);
      fetchProfile(currentViewer);
    })();
  }, [fetchProfile]);

  const { busyIds, sendRequest, removeFriend } = useFriendActions(
    viewerLogin,
    useCallback(() => (viewerLogin ? fetchProfile(viewerLogin) : undefined), [viewerLogin, fetchProfile])
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="#3498db" loading={loading} size={100} />
      </div>
    );
  }

  if (!profile) {
    return (
      <PageTemplate name="Profile">
        <p className="text-center text-muted-foreground py-12">User not found.</p>
      </PageTemplate>
    );
  }

  // Every incoming/outgoing pending request has a numeric id the accept/decline/cancel
  // endpoints need, but this page only gets a relationshipStatus - not the request id - from
  // /profile. So a REQUEST_RECEIVED/REQUEST_SENT state here just points the user at the
  // Friends page, where the actual request row (and its id) lives.
  const isRequestPending = profile.relationshipStatus === "REQUEST_SENT" || profile.relationshipStatus === "REQUEST_RECEIVED";

  return (
    <PageTemplate name="Profile">
      <div className="max-w-lg mx-auto w-full p-4">
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <Avatar className="h-24 w-24">
            {profile.profilePicture && <AvatarImage src={profile.profilePicture} alt={profile.firstName} />}
            <AvatarFallback className="text-2xl">
              {profile.firstName?.[0]?.toUpperCase()}{profile.lastName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-muted-foreground">@{profile.login}</p>
          </div>

          {profile.bio && <p className="text-sm max-w-sm">{profile.bio}</p>}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="w-4 h-4" />
            {profile.friendCount} friend{profile.friendCount === 1 ? "" : "s"}
          </div>

          <div className="pt-2">
            {profile.relationshipStatus === "SELF" && (
              <Button variant="outline" size="sm" asChild>
                <a href="/edit-profile">Edit Profile</a>
              </Button>
            )}

            {profile.relationshipStatus === "NONE" && (
              <Button size="sm" disabled={busyIds.has(profile.login)} onClick={() => sendRequest(profile.login)}>
                <UserPlus className="w-4 h-4 mr-1.5" /> Add Friend
              </Button>
            )}

            {isRequestPending && (
              <Button variant="outline" size="sm" asChild className="flex items-center gap-1.5">
                <a href="/friends">
                  <Clock className="w-4 h-4" />
                  {profile.relationshipStatus === "REQUEST_SENT" ? "Request Pending" : "Respond to Request"}
                </a>
              </Button>
            )}

            {profile.relationshipStatus === "FRIENDS" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={busyIds.has(profile.login)} className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Friends
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {profile.firstName} {profile.lastName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll need to send a new friend request if you want to reconnect later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeFriend(profile.login)}>
                      <UserX className="w-4 h-4 mr-1.5" /> Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
