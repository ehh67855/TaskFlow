"use client"
import { BACKEND_API_URL } from "@/config/site";

import React, { useMemo, useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";

const TOP_LEVEL = "top-level";

const folderPath = (folderId, foldersById) => {
  const names = [];
  let current = folderId ? foldersById.get(folderId) : null;
  while (current) {
    names.unshift(current.name);
    current = current.parentFolderId ? foldersById.get(current.parentFolderId) : null;
  }
  return names.join(" / ");
};

export const descendantIds = (folderId, folders) => {
  const ids = new Set();
  const queue = [folderId];
  while (queue.length > 0) {
    const current = queue.pop();
    folders.filter(f => f.parentFolderId === current).forEach(child => {
      ids.add(child.id);
      queue.push(child.id);
    });
  }
  return ids;
};

// Shared by the dialog below and by drag-and-drop on the home page, so both paths hit the
// same endpoints/payload shape. item: { id, type: 'network' | 'folder' }. targetFolderId is
// null for "top level".
export const moveItem = async (item, targetFolderId) => {
  const authToken = await getAuthToken();
  const login = await getLogin(authToken);

  const endpoint = item.type === 'folder' ? 'move-folder' : 'move-network';
  const payload = item.type === 'folder'
    ? { id: String(item.id), login, parentFolderId: targetFolderId }
    : { id: String(item.id), login, folderId: targetFolderId };

  const res = await fetch(`${BACKEND_API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = new Error('Failed to move');
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// item: { id, type: 'network' | 'folder', currentFolderId, name }
export default function MoveItemDialog({ open, onOpenChange, item, folders, onMoved }) {
  const [destination, setDestination] = useState(TOP_LEVEL);
  const { toast } = useToast();

  const foldersById = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

  const options = useMemo(() => {
    if (!item) return [];
    const excluded = item.type === 'folder' ? descendantIds(item.id, folders) : new Set();
    if (item.type === 'folder') excluded.add(item.id);
    return folders
      .filter(f => !excluded.has(f.id))
      .map(f => ({ id: f.id, label: folderPath(f.id, foldersById) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [item, folders, foldersById]);

  React.useEffect(() => {
    if (open && item) {
      setDestination(item.currentFolderId ? String(item.currentFolderId) : TOP_LEVEL);
    }
  }, [open, item]);

  const handleMove = async () => {
    const targetFolderId = destination === TOP_LEVEL ? null : destination;
    try {
      const data = await moveItem(item, targetFolderId);
      onMoved(item.type, data);
      onOpenChange(false);
    } catch (error) {
      if (error.status === 409) {
        toast({ variant: "destructive", title: "Name Conflict", description: "Something with that name already exists there." });
      } else {
        toast({ variant: "destructive", title: "Unexpected Error", description: "Something went wrong while moving." });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move &ldquo;{item?.name}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          <Label>Destination</Label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOP_LEVEL}>Top Level</SelectItem>
              {options.map(opt => (
                <SelectItem key={opt.id} value={String(opt.id)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMove}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
