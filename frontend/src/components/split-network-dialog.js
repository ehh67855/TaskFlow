"use client"

import React, { useEffect, useState } from 'react';
import { getAuthToken, getLogin } from '@/services/BackendService';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// node: the category or info node being split off (and its full descendant subtree). onSplit(newNetwork)
// - the caller navigates to it, since the node (and everything under it) is gone from the
// current network the moment this succeeds.
export default function SplitNetworkDialog({ open, onOpenChange, node, onSplit }) {
  const [name, setName] = useState("");
  const [splitting, setSplitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && node) setName(node.title || "");
  }, [open, node]);

  const handleSplit = async () => {
    if (!node || !name.trim()) return;
    setSplitting(true);
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      const res = await fetch('http://localhost:8080/split-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id, newNetworkName: name.trim(), login })
      });
      if (!res.ok) throw new Error('Failed to split network');
      const data = await res.json();
      onSplit(data);
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Unexpected Error", description: "Something went wrong while splitting the network." });
    } finally {
      setSplitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split into a New Network</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          &ldquo;{node?.title}&rdquo; and everything under it will move out of this network into a
          new one, where it becomes the Root Node. This can&apos;t be undone.
        </p>

        <div className="grid gap-2 py-2">
          <Label htmlFor="new-network-name">New network name</Label>
          <Input
            id="new-network-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSplit} disabled={!name.trim() || splitting}>
            {splitting ? "Splitting..." : "Split"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
