"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, UserCheck, UserX, Clock, Users as UsersIcon, UserRound, Share2 } from "lucide-react";
import { PageTemplate } from "@/components/page-template";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MiniNetwork from "@/components/mini-network.js";
import { useToast } from "@/hooks/use-toast";
import { notifyBadgeCheck } from "@/lib/badge-events";
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
import { getAuthToken, getLogin } from "@/services/BackendService";
import { formatApiUrl } from "@/lib/utils";
import { useFriendActions } from "@/hooks/use-friend-actions";
import type { FriendRequestData, UserSummary } from "@/types/user";

interface FriendNetwork {
  id: number;
  name: string;
  ownerLogin: string;
  ownerName: string;
  nodes: unknown[];
  edges: unknown[];
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function UserRow({
  user,
  subtitle,
  children,
}: {
  user: { login: string; firstName: string; lastName: string; profilePicture?: string | null };
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Link href={`/profile/${user.login}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
        <Avatar className="h-10 w-10">
          {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.firstName} />}
          <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle ?? `@${user.login}`}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

export default function FriendsPage() {
  const { toast } = useToast();
  const [login, setLogin] = useState<string | null>(null);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestData[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestData[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendNetworks, setFriendNetworks] = useState<FriendNetwork[]>([]);
  const [addingNetworkId, setAddingNetworkId] = useState<number | null>(null);
  const [addedNetworkIds, setAddedNetworkIds] = useState<Set<number>>(new Set());

  const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getAuthToken();
    return fetch(formatApiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  }, []);

  const runSearch = useCallback(async (currentLogin: string, q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await authedFetch(`/users/search?login=${encodeURIComponent(currentLogin)}&query=${encodeURIComponent(q.trim())}`);
    if (res.ok) setSearchResults(await res.json());
  }, [authedFetch]);

  const fetchAll = useCallback(async (currentLogin: string) => {
    try {
      const [friendsRes, incomingRes, outgoingRes, networksRes] = await Promise.all([
        authedFetch(`/friends/${encodeURIComponent(currentLogin)}`),
        authedFetch(`/friend-requests/incoming/${encodeURIComponent(currentLogin)}`),
        authedFetch(`/friend-requests/outgoing/${encodeURIComponent(currentLogin)}`),
        authedFetch(`/friends-networks?login=${encodeURIComponent(currentLogin)}`),
      ]);
      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (incomingRes.ok) setIncoming(await incomingRes.json());
      if (outgoingRes.ok) setOutgoing(await outgoingRes.json());
      if (networksRes.ok) setFriendNetworks(await networksRes.json());
      // Keeps a visible search result's status (e.g. NONE -> REQUEST_SENT) in sync with
      // whatever action was just taken, instead of only the Friends/Requests tabs updating.
      await runSearch(currentLogin, query);
    } catch (error) {
      console.error("Failed to load friends data:", error);
    }
  }, [authedFetch, runSearch, query]);

  const addNetworkToCollection = async (network: FriendNetwork) => {
    if (!login) return;
    setAddingNetworkId(network.id);
    try {
      const res = await authedFetch("/clone-network", {
        method: "POST",
        body: JSON.stringify({ networkId: network.id, login }),
      });
      if (!res.ok) throw new Error("Failed to add this network to your collection");
      setAddedNetworkIds((prev) => new Set(prev).add(network.id));
      notifyBadgeCheck();
      toast({
        title: "Added to your collection",
        description: `"${network.name}" now shows up on your Home dashboard.`,
      });
    } catch (error) {
      console.error("Failed to clone network:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn't add this network to your collection. Please try again.",
      });
    } finally {
      setAddingNetworkId(null);
    }
  };

  const { busyIds, sendRequest, acceptRequest, declineRequest, cancelRequest, removeFriend } = useFriendActions(
    login,
    useCallback(() => (login ? fetchAll(login) : undefined), [login, fetchAll])
  );

  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      const currentLogin = await getLogin(token);
      if (!currentLogin) return;
      setLogin(currentLogin);
      fetchAll(currentLogin);
    })();
    // Deliberately only on mount - fetchAll is intentionally re-created when `query` changes
    // (so action callbacks always re-search with the latest query), but that shouldn't itself
    // trigger a full refetch of friends/requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search-as-you-type against /users/search.
  useEffect(() => {
    if (!login) return;
    setSearching(true);
    const handle = setTimeout(async () => {
      await runSearch(login, query);
      setSearching(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, login, runSearch]);

  return (
    <PageTemplate name="Friends">
      <div className="max-w-4xl mx-auto w-full p-4">
        <Tabs defaultValue="friends">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="friends" className="flex items-center gap-1.5">
              <UsersIcon className="w-4 h-4" /> Friends {friends.length > 0 && `(${friends.length})`}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Requests {incoming.length > 0 && `(${incoming.length})`}
            </TabsTrigger>
            <TabsTrigger value="networks" className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4" /> Networks {friendNetworks.length > 0 && `(${friendNetworks.length})`}
            </TabsTrigger>
            <TabsTrigger value="find" className="flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Find People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card className="p-4 divide-y divide-border">
              {friends.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No friends yet - head to Find People to add some.
                </p>
              )}
              {friends.map((friend) => (
                <UserRow key={friend.login} user={friend}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={busyIds.has(friend.login)}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {friend.firstName} {friend.lastName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You&apos;ll need to send a new friend request if you want to reconnect later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeFriend(friend.login)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </UserRow>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="p-4 divide-y divide-border">
              {incoming.length === 0 && outgoing.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No pending requests.</p>
              )}
              {incoming.map((request) => (
                <UserRow key={request.id} user={request.sender} subtitle="wants to be friends">
                  <Button size="sm" disabled={busyIds.has(request.id)} onClick={() => acceptRequest(request.id)}>
                    <UserCheck className="w-4 h-4 mr-1.5" /> Accept
                  </Button>
                  <Button variant="ghost" size="sm" disabled={busyIds.has(request.id)} onClick={() => declineRequest(request.id)}>
                    Decline
                  </Button>
                </UserRow>
              ))}
              {outgoing.map((request) => (
                <UserRow key={request.id} user={request.receiver} subtitle="request pending">
                  <Button variant="outline" size="sm" disabled={busyIds.has(request.id)} onClick={() => cancelRequest(request.id)}>
                    Cancel
                  </Button>
                </UserRow>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="networks">
            {friendNetworks.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                None of your friends have shared a network with you yet.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friendNetworks.map((network) => {
                const isAdding = addingNetworkId === network.id;
                const isAdded = addedNetworkIds.has(network.id);
                return (
                  <Card key={network.id} className="shadow-md">
                    <CardContent className="space-y-3 p-4">
                      <CardTitle className="text-center text-lg font-semibold">{network.name}</CardTitle>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                        <UserRound className="w-3.5 h-3.5" />
                        <span>{network.ownerName || network.ownerLogin}</span>
                      </div>
                      <MiniNetwork nodes={network.nodes} edges={network.edges} />
                      <div className="flex justify-center mt-2">
                        <Button
                          variant={isAdded ? "outline" : "default"}
                          size="sm"
                          disabled={isAdding || isAdded}
                          onClick={() => addNetworkToCollection(network)}
                        >
                          {isAdded ? "Added to Your Collection" : isAdding ? "Adding..." : "Add to My Collection"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="find">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Card className="p-4 divide-y divide-border">
              {query.trim() && !searching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No users found.</p>
              )}
              {searchResults.map((user) => (
                <UserRow key={user.login} user={user}>
                  {user.relationshipStatus === "FRIENDS" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="w-4 h-4" /> Friends
                    </span>
                  )}
                  {user.relationshipStatus === "REQUEST_SENT" && (
                    <span className="text-xs text-muted-foreground">Request sent</span>
                  )}
                  {user.relationshipStatus === "REQUEST_RECEIVED" && (
                    <span className="text-xs text-muted-foreground">Check Requests tab</span>
                  )}
                  {(user.relationshipStatus === "NONE" || !user.relationshipStatus) && (
                    <Button size="sm" disabled={busyIds.has(user.login)} onClick={() => sendRequest(user.login)}>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Add Friend
                    </Button>
                  )}
                </UserRow>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTemplate>
  );
}
