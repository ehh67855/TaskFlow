"use client"

import React, { useState } from 'react';
import { getAuthToken, getLogin } from '@/services/BackendService';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// targetNetwork: the network being merged INTO (stays around). networks: the user's full
// list, filtered down to everything else as candidates to merge IN. onMerged(updatedTarget,
// mergedSourceId) - the caller updates its own network list: replace targetNetwork with
// updatedTarget, and drop mergedSourceId entirely (the backend deletes that network once the
// merge succeeds).
export default function MergeNetworkDialog({ open, onOpenChange, targetNetwork, networks, onMerged }) {
  const [sourceId, setSourceId] = useState("");
  const [merging, setMerging] = useState(false);
  const { toast } = useToast();

  const options = networks.filter(n => targetNetwork && n.id !== targetNetwork.id);
  const selected = options.find(n => String(n.id) === sourceId);

  React.useEffect(() => {
    if (open) setSourceId("");
  }, [open]);

  const handleMerge = async () => {
    if (!sourceId || !targetNetwork) return;
    setMerging(true);
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      const res = await fetch('http://localhost:8080/merge-networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetNetworkId: targetNetwork.id, sourceNetworkId: sourceId, login })
      });
      if (!res.ok) throw new Error('Failed to merge');
      const data = await res.json();
      onMerged(data, Number(sourceId));
      onOpenChange(false);
      toast({
        title: "Networks merged",
        description: `"${selected?.name}" has been merged into "${targetNetwork.name}".`
      });
    } catch {
      toast({ variant: "destructive", title: "Unexpected Error", description: "Something went wrong while merging." });
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge into &ldquo;{targetNetwork?.name}&rdquo;</DialogTitle>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            The network you pick will be merged into &ldquo;{targetNetwork?.name}&rdquo; and then deleted -
            its root node becomes a category node here. This can&apos;t be undone.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2 py-2">
          <Label>Network to merge in</Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a network" />
            </SelectTrigger>
            <SelectContent>
              {options.map(n => (
                <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground">You don&apos;t have any other networks to merge in.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleMerge} disabled={!sourceId || merging}>
            {merging ? "Merging..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
