"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getLogin } from "@/services/BackendService";
import MarketplaceNetworkViewer from "@/components/marketplace-network-viewer.js";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserRound } from "lucide-react";
import { notifyBadgeCheck } from "@/lib/badge-events";

export default function MarketplaceNetworkDetail() {
  const params = useParams();
  const id = params.id;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const loginRef = useRef(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const authToken = await getAuthToken();
        loginRef.current = await getLogin(authToken);

        const res = await fetch(`http://localhost:8080/marketplace/networks/${id}`, { method: "GET" });
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setNetwork(await res.json());
      } catch (error) {
        console.error("Failed to fetch marketplace network:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const addToCollection = async () => {
    setAdding(true);
    try {
      const res = await fetch(`http://localhost:8080/clone-network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ networkId: id, login: loginRef.current })
      });
      if (!res.ok) throw new Error("Failed to add this network to your collection");
      setAdded(true);
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
      setAdding(false);
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold text-center mt-10">Loading...</h1>;
  }

  if (notFound || !network) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <p>This network isn&apos;t available on the marketplace anymore.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Toaster />
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{network.name}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <UserRound className="w-3.5 h-3.5" />
            <span>{network.ownerName || network.ownerLogin}</span>
          </div>
        </div>
        <Button
          variant={added ? "outline" : "default"}
          disabled={adding || added}
          onClick={addToCollection}
        >
          {added ? "Added to Your Collection" : adding ? "Adding..." : "Add to My Collection"}
        </Button>
      </div>

      <MarketplaceNetworkViewer nodes={network.nodes} edges={network.edges} />
    </div>
  );
}
