"use client"

import React, { useEffect, useRef, useState } from 'react';
import { getAuthToken, getLogin } from "@/services/BackendService";
import MiniNetwork from "@/components/mini-network.js";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { notifyBadgeCheck } from "@/lib/badge-events";

import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Search, Store, UserRound, X } from "lucide-react";

// Debounced (rather than searching on every keystroke against the live network) so typing a
// full search term doesn't fire a request per character - a marketplace listing is exactly
// the kind of page people will type into quickly.
const SEARCH_DEBOUNCE_MS = 300;

export default function Marketplace() {
  const [loading, setLoading] = useState(true);
  const [networks, setNetworks] = useState([]);
  const [myPublished, setMyPublished] = useState([]);
  const [unpublishingId, setUnpublishingId] = useState(null);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const loginRef = useRef(null);
  const debounceRef = useRef(null);
  const { toast } = useToast();

  const fetchListings = async (term) => {
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      loginRef.current = login;

      const params = new URLSearchParams();
      if (term) params.set("search", term);
      if (login) params.set("login", login);

      const res = await fetch(`http://localhost:8080/marketplace/networks?${params.toString()}`, {
        method: "GET"
      });
      if (!res.ok) throw new Error("Failed to load the marketplace");
      setNetworks(await res.json());
    } catch (error) {
      console.error("Failed to fetch marketplace listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // What you've published, so you can see (and take back down) your own listings without
  // having to remember which network it was and open it individually. Reuses the same
  // endpoint the Home dashboard fetches from - it already carries each network's `published`
  // flag - rather than adding a second, marketplace-specific "my networks" endpoint.
  const fetchMyPublished = async (login) => {
    try {
      const res = await fetch(`http://localhost:8080/getUserNetworksByLogin/${login}`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to load your published networks");
      const all = await res.json();
      setMyPublished(all.filter(n => n.published));
    } catch (error) {
      console.error("Failed to fetch your published networks:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      loginRef.current = login;
      fetchMyPublished(login);
    };
    init();
    fetchListings("");
  }, []);

  const unpublishNetwork = async (network) => {
    setUnpublishingId(network.id);
    try {
      const res = await fetch(`http://localhost:8080/publish-network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: network.id, login: loginRef.current, published: false })
      });
      if (!res.ok) throw new Error("Failed to unpublish");
      setMyPublished(prev => prev.filter(n => n.id !== network.id));
      toast({
        title: "Removed from the marketplace",
        description: `"${network.name}" is no longer visible to other members.`
      });
    } catch (error) {
      console.error("Failed to unpublish network:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't remove this network from the marketplace. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUnpublishingId(null);
    }
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchListings(value), SEARCH_DEBOUNCE_MS);
  };

  const addToCollection = async (network) => {
    setAddingId(network.id);
    try {
      const res = await fetch(`http://localhost:8080/clone-network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ networkId: network.id, login: loginRef.current })
      });
      if (!res.ok) throw new Error("Failed to add this network to your collection");
      setAddedIds(prev => new Set(prev).add(network.id));
      notifyBadgeCheck();
      toast({
        title: "Added to your collection",
        description: `"${network.name}" now shows up on your Home dashboard.`
      });
    } catch (error) {
      console.error("Failed to clone network:", error);
      toast({
        title: "Something went wrong",
        description: "Couldn't add this network to your collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold text-center mt-10">Loading...</h1>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Toaster />
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-7 h-7" />
        <h1 className="text-3xl font-bold">Marketplace</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Browse networks other members have shared, and add any of them straight to your own collection.
      </p>

      {myPublished.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your Published Networks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPublished.map((network) => (
              <Card key={`mine-${network.id}`} className="custom-card shadow-md">
                <CardContent className="space-y-3 p-4">
                  <CardTitle className="text-center text-lg font-semibold">{network.name}</CardTitle>
                  <MiniNetwork nodes={network.nodes} edges={network.edges} />
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="destructive"
                      disabled={unpublishingId === network.id}
                      onClick={() => unpublishNetwork(network)}
                      className="flex items-center gap-2 transition-all duration-150 hover:scale-[1.03]"
                    >
                      <X className="w-4 h-4" />
                      {unpublishingId === network.id ? "Removing..." : "Remove from Marketplace"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Browse the Marketplace</h2>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search the marketplace..."
          className="pl-9"
        />
      </div>

      {networks.length === 0 && (
        <Alert variant="default">
          {search
            ? `No published networks match "${search}".`
            : "No networks have been published to the marketplace yet."}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {networks.map((network) => {
          const isAdding = addingId === network.id;
          const isAdded = addedIds.has(network.id);
          return (
            <Card
              key={network.id}
              className="custom-card shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => { window.location.href = `/marketplace/${network.id}`; }}
            >
              <CardContent className="space-y-3 p-4">
                <CardTitle className="text-center text-lg font-semibold">{network.name}</CardTitle>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <UserRound className="w-3.5 h-3.5" />
                  <span>{network.ownerName || network.ownerLogin}</span>
                </div>
                {/* Physics/zoom/drag are all off here on purpose - this is just a static
                    thumbnail, "click through" happens on the detail page. */}
                <MiniNetwork nodes={network.nodes} edges={network.edges} />

                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="transition-all duration-150 hover:scale-[1.03]"
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/marketplace/${network.id}`; }}
                  >
                    View
                  </Button>
                  <Button
                    variant={isAdded ? "outline" : "default"}
                    disabled={isAdding || isAdded}
                    onClick={(e) => { e.stopPropagation(); addToCollection(network); }}
                    className="transition-all duration-150 hover:scale-[1.03]"
                  >
                    {isAdded ? "Added to Your Collection" : isAdding ? "Adding..." : "Add to My Collection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
