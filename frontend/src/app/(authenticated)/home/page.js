"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { getAuthToken, getLogin } from "@/services/BackendService";
import NetworkCreator from '../../../components/network-creator.js';
import FolderCreator from '../../../components/folder-creator.js';
import MoveItemDialog, { moveItem, descendantIds } from '../../../components/move-item-dialog.js';
import MergeNetworkDialog from '../../../components/merge-network-dialog.js';

import { GoTrash, GoPencil, GoFileDirectoryFill, GoArrowRight, GoGitMerge, GoHome } from "react-icons/go";
import { MoreVertical, Eye, Store, Users, UserX, Download } from "lucide-react";
import { downloadNetworkExport } from "@/lib/network-export";
import MiniNetwork from "../../../components/mini-network.js";

import {
  Card,
  CardTitle,
  CardContent
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [networks, setNetworks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  // A folder id being dragged over, or 'root' for the "Home" breadcrumb drop target.
  const [dragOverTarget, setDragOverTarget] = useState(null);
  // { type: 'network' | 'folder', id, name } for whatever's pending confirmation in the shared
  // delete AlertDialog below, or null when it's closed.
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  const fetchUserData = async () => {
    try {
      const authToken = await getAuthToken()
      const login = await getLogin(authToken);
      const [networksRes, foldersRes] = await Promise.all([
        fetch(`http://localhost:8080/getUserNetworksByLogin/${login}`, { method: "GET" }),
        fetch(`http://localhost:8080/getUserFoldersByLogin/${login}`, { method: "GET" })
      ]);
      if (!networksRes.ok || !foldersRes.ok) {
        throw new Error('Network response was not ok');
      }
      setNetworks(await networksRes.json());
      setFolders(await foldersRes.json());
    } catch (error) {
      console.error("Failed to fetch user workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const foldersById = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

  const breadcrumb = useMemo(() => {
    const trail = [];
    let current = currentFolderId ? foldersById.get(currentFolderId) : null;
    while (current) {
      trail.unshift(current);
      current = current.parentFolderId ? foldersById.get(current.parentFolderId) : null;
    }
    return trail;
  }, [currentFolderId, foldersById]);

  const visibleFolders = folders.filter(f => (f.parentFolderId ?? null) === currentFolderId);
  const visibleNetworks = networks.filter(n => (n.folderId ?? null) === currentFolderId);
  const isEmpty = visibleFolders.length === 0 && visibleNetworks.length === 0;

  const itemCount = (folderId) =>
    folders.filter(f => f.parentFolderId === folderId).length +
    networks.filter(n => n.folderId === folderId).length;

  const deleteNetwork = async (id) => {
    try {
      await fetch(`http://localhost:8080/delete-network/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      setNetworks(networks.filter(network => network.id !== id));
    } catch (error) {
      console.error("Failed to delete network:", error);
    }
  };

  const togglePublish = async (network) => {
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      const res = await fetch(`http://localhost:8080/publish-network`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: network.id, login, published: !network.published })
      });
      if (!res.ok) throw new Error('Failed to update marketplace listing');
      const updated = await res.json();
      setNetworks(prev => prev.map(n => n.id === network.id ? { ...n, published: updated.published, publishedAt: updated.publishedAt } : n));
    } catch (error) {
      console.error("Failed to toggle marketplace listing:", error);
      toast({
        variant: "destructive",
        title: "Couldn't update the marketplace listing",
        description: "Please try again."
      });
    }
  };

  const toggleVisibleToFriends = async (network) => {
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      const res = await fetch(`http://localhost:8080/set-network-visibility`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: network.id, login, visibleToFriends: !network.visibleToFriends })
      });
      if (!res.ok) throw new Error('Failed to update friends visibility');
      const updated = await res.json();
      setNetworks(prev => prev.map(n => n.id === network.id ? { ...n, visibleToFriends: updated.visibleToFriends } : n));
    } catch (error) {
      console.error("Failed to toggle friends visibility:", error);
      toast({
        variant: "destructive",
        title: "Couldn't update this network's visibility to friends",
        description: "Please try again."
      });
    }
  };

  // Only the emptiness check happens here, up front - so a folder that can't be deleted never
  // gets as far as showing a confirmation dialog for an action that's just going to fail.
  const handleDeleteFolderClick = (folder) => {
    if (itemCount(folder.id) > 0) {
      toast({
        variant: "destructive",
        title: "Folder isn't empty",
        description: "Move or delete its contents first."
      });
      return;
    }
    setDeleteConfirm({ type: 'folder', id: folder.id, name: folder.name });
  };

  const deleteFolder = async (folder) => {
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      // login must be query-string encoded (not just interpolated) - a raw '+' in an email
      // like "name+tag@gmail.com" otherwise gets decoded server-side as a space, so the
      // backend looks up a login that doesn't exist and 404s every delete for that account.
      const res = await fetch(`http://localhost:8080/delete-folder/${folder.id}?login=${encodeURIComponent(login)}`, {
        method: "POST"
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message ?? 'Failed to delete folder');
      }
      setFolders(folders.filter(f => f.id !== folder.id));
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast({
        variant: "destructive",
        title: "Couldn't delete folder",
        description: error.message || "Something went wrong while deleting this folder."
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    setDeleteConfirm(null);
    if (type === 'network') {
      deleteNetwork(id);
    } else {
      const folder = folders.find(f => f.id === id);
      if (folder) deleteFolder(folder);
    }
  };

  // updatedTarget already reflects the merged-in content (fetched fresh from the backend);
  // mergedSourceId's network is gone for good once the merge succeeds, so it's dropped here
  // rather than just hidden.
  const handleMerged = (updatedTarget, mergedSourceId) => {
    setNetworks(prev => prev
      .filter(n => n.id !== mergedSourceId)
      .map(n => n.id === updatedTarget.id ? updatedTarget : n));
  };

  const handleMoved = (type, data) => {
    if (type === 'folder') {
      setFolders(prev => prev.map(f => f.id === data.id ? data : f));
    } else {
      setNetworks(prev => prev.map(n => n.id === data.id ? data : n));
    }
  };

  // targetFolderId is null for the top level ("Home").
  const canDropOn = (targetFolderId) => {
    if (!draggedItem) return false;
    if (draggedItem.currentFolderId === targetFolderId) return false;
    if (draggedItem.type === 'folder') {
      if (draggedItem.id === targetFolderId) return false;
      if (targetFolderId !== null && descendantIds(draggedItem.id, folders).has(targetFolderId)) return false;
    }
    return true;
  };

  const handleDrop = async (targetFolderId) => {
    const item = draggedItem;
    setDraggedItem(null);
    setDragOverTarget(null);
    if (!item || !canDropOn(targetFolderId)) return;

    try {
      const data = await moveItem(item, targetFolderId);
      handleMoved(item.type, data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't move that",
        description: error.status === 409 ? "Something with that name already exists there." : "Something went wrong while moving."
      });
    }
  };

  // item: { id, type, name, currentFolderId } - what this card represents, for starting a drag.
  const draggableProps = (item) => ({
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(item.id));
      setDraggedItem(item);
    },
    onDragEnd: () => {
      setDraggedItem(null);
      setDragOverTarget(null);
    }
  });

  // targetFolderId: the folder this drop zone represents, or null for the top level.
  const dropTargetProps = (targetFolderId) => {
    const key = targetFolderId ?? 'root';
    return {
      onDragOver: (e) => {
        if (canDropOn(targetFolderId)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverTarget(key);
        }
      },
      onDragLeave: () => setDragOverTarget(prev => (prev === key ? null : prev)),
      onDrop: (e) => {
        e.preventDefault();
        handleDrop(targetFolderId);
      }
    };
  };

  if (loading) {
    return <h1 className="text-2xl font-bold text-center mt-10">Loading...</h1>;
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-4 relative">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
          <button
            className={`flex items-center gap-1 hover:text-foreground rounded px-1 ${dragOverTarget === 'root' ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
            onClick={() => setCurrentFolderId(null)}
            {...dropTargetProps(null)}
          >
            <GoHome className="w-4 h-4" /> Home
          </button>
          {breadcrumb.map((folder) => (
            <React.Fragment key={folder.id}>
              <span>/</span>
              <button
                className={`hover:text-foreground rounded px-1 ${dragOverTarget === folder.id ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
                onClick={() => setCurrentFolderId(folder.id)}
                {...dropTargetProps(folder.id)}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <NetworkCreator setNetworks={setNetworks} folderId={currentFolderId} />
          <FolderCreator setFolders={setFolders} folderId={currentFolderId} />
        </div>

        {isEmpty && (
          <Alert variant="default">This folder is empty. Create a network or folder to get started.</Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {visibleFolders.map((folder) => (
            <Card
              key={`folder-${folder.id}`}
              className={`custom-card shadow-md hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing ${dragOverTarget === folder.id ? 'ring-2 ring-primary' : ''}`}
              {...draggableProps({ id: folder.id, type: 'folder', name: folder.name, currentFolderId: folder.parentFolderId })}
              {...dropTargetProps(folder.id)}
            >
              <CardContent className="space-y-4 p-4">
                <button
                  className="w-full flex flex-col items-center gap-2 py-6"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <GoFileDirectoryFill className="w-10 h-10 text-amber-500" />
                  <CardTitle className="text-center text-lg font-semibold">{folder.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{itemCount(folder.id)} item(s)</span>
                </button>

                <div className="flex justify-center gap-3 mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="destructive" onClick={() => handleDeleteFolderClick(folder)}>
                        <GoTrash className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Delete this folder</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setMoveTarget({ id: folder.id, type: 'folder', currentFolderId: folder.parentFolderId, name: folder.name })}
                      >
                        <GoArrowRight className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Move this folder</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => setCurrentFolderId(folder.id)}>Open</Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Open this folder</p></TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}

          {visibleNetworks.map((network) => (
            <Card
              key={`network-${network.id}`}
              className="custom-card shadow-md hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing"
              {...draggableProps({ id: network.id, type: 'network', name: network.name, currentFolderId: network.folderId })}
              onDoubleClick={() => { window.location.href = `/network/${network.id}`; }}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex-1 text-center text-lg font-semibold truncate">{network.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                        <span className="sr-only">Network options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/network/${network.id}`} className="flex items-center gap-2 cursor-pointer">
                          <GoPencil className="w-4 h-4" /> Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/network/${network.id}?mode=preview`} className="flex items-center gap-2 cursor-pointer">
                          <Eye className="w-4 h-4" /> Preview
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => downloadNetworkExport(network.name, network.nodes, network.edges)}
                      >
                        <Download className="w-4 h-4" /> Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setMoveTarget({ id: network.id, type: 'network', currentFolderId: network.folderId, name: network.name })}
                      >
                        <GoArrowRight className="w-4 h-4" /> Move
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setMergeTarget(network)}
                      >
                        <GoGitMerge className="w-4 h-4" /> Merge
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => togglePublish(network)}
                      >
                        <Store className="w-4 h-4" />
                        {network.published ? "Unpublish from Marketplace" : "Publish to Marketplace"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleVisibleToFriends(network)}
                      >
                        {network.visibleToFriends ? <UserX className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        {network.visibleToFriends ? "Hide from Friends" : "Share with Friends"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => setDeleteConfirm({ type: 'network', id: network.id, name: network.name })}
                      >
                        <GoTrash className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <MiniNetwork nodes={network.nodes} edges={network.edges} />
              </CardContent>
            </Card>
          ))}
        </div>

        <MoveItemDialog
          open={moveTarget !== null}
          onOpenChange={(open) => { if (!open) setMoveTarget(null); }}
          item={moveTarget}
          folders={folders}
          onMoved={handleMoved}
        />

        <MergeNetworkDialog
          open={mergeTarget !== null}
          onOpenChange={(open) => { if (!open) setMergeTarget(null); }}
          targetNetwork={mergeTarget}
          networks={networks}
          onMerged={handleMerged}
        />

        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {deleteConfirm?.type === 'folder' ? 'folder' : 'network'} &quot;{deleteConfirm?.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirm?.type === 'folder'
                  ? "This can't be undone."
                  : "All of its contents will be lost. This can't be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
