"use client"
import { BACKEND_API_URL } from "@/config/site";

import React, { useRef, useState } from 'react';
import { getAuthToken, getLogin } from '@/services/BackendService';
import { GoPlus } from "react-icons/go";
import { CheckCircle2 } from "lucide-react";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";

import {
  Button
} from "@/components/ui/button";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { notifyBadgeCheck } from "@/lib/badge-events";
import { parseNetworkImport } from "@/lib/network-export";

const EMPTY_IMPORT = { nodes: [], edges: [] };

export default function NetworkCreator({ setNetworks = () => window.location.reload(), folderId = null }) {
  const [modalShow, setModalShow] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [importedData, setImportedData] = useState(EMPTY_IMPORT);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({ name: "" });
    setImportedData(EMPTY_IMPORT);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = parseNetworkImport(event.target.result);
        setImportedData(data);
        // Only fills in a name that's still blank - an import shouldn't clobber a name the
        // user already typed before picking a file.
        setFormData(prev => prev.name.trim() ? prev : { ...prev, name: data.name || "" });
      } catch (error) {
        setImportedData(EMPTY_IMPORT);
        toast({
          variant: "destructive",
          title: "Couldn't import that file",
          description: error.message
        });
      }
    };
    reader.readAsText(file);
  };

  const handleModalSave = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Could not create network",
        description: "Network name is required."
      });
      setModalShow(false);
      return;
    }

    const authToken = await getAuthToken()
    const login = await getLogin(authToken)
    const requestData = {
      login: login,
      name: formData.name,
      folderId: folderId ? String(folderId) : null,
      // The export format only carries `title` (the canonical text) - `label` is just its
      // truncated-for-canvas-display copy, which the app re-derives on every subsequent fetch
      // anyway (see NetworkPage's fetchNetwork), but the backend still expects one up front.
      nodes: importedData.nodes.map(n => ({ ...n, label: n.title })),
      edges: importedData.edges
    };

    try {
      const response = await fetch(`${BACKEND_API_URL}/create-network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setModalShow(false);
        resetForm();
        setNetworks(prev => [...prev, data]);
        notifyBadgeCheck();
      } else if (response.status === 409) {
        toast({
          variant: "destructive",
          title: "Name Conflict",
          description: "Network name already in use."
        });
        setModalShow(false);
      } else {
        const error = await response.json().catch(() => null);
        toast({
          variant: "destructive",
          title: "Could not create network",
          description: error?.message ?? "Something went wrong. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "Something went wrong while creating the network."
      });
    }
  };

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="space-y-4">
      <MovingBorderButton
        borderRadius="1.25rem"
        className="bg-white dark:bg-black text-black dark:text-white border-neutral-200 dark:border-slate-800 flex flex-row gap-2 items-center"
        containerClassName=""
        onClick={() => setModalShow(true)}
      >
        <GoPlus className="size-4" />
        Add Network
      </MovingBorderButton>
          <Dialog
            open={modalShow}
            onOpenChange={(open) => {
              setModalShow(open);
              if (!open) resetForm();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Network</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter the name of your network"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="importFile">Import Network (optional)</Label>
                  <Input id="importFile" ref={fileInputRef} type="file" accept="application/json" size="sm" onChange={handleFileChange} />
                  <p className="text-xs text-muted-foreground">
                    Upload a network exported from TaskFlow (Export as JSON) to recreate it here instead of starting blank.
                  </p>
                  {importedData.nodes.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Imported {importedData.nodes.length} node{importedData.nodes.length === 1 ? "" : "s"} and {importedData.edges.length} edge{importedData.edges.length === 1 ? "" : "s"}.
                    </p>
                  )}
                </div>

              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setModalShow(false)}>Cancel</Button>
                <Button onClick={handleModalSave}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ToastViewport />
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
