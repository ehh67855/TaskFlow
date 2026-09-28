"use client"

import React, { useState } from 'react';
import { getAuthToken, getLogin } from '@/services/BackendService';
import { GoFileDirectory } from "react-icons/go";

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

export default function FolderCreator({ setFolders = () => {}, folderId = null }) {
  const [modalShow, setModalShow] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleModalSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Could not create folder",
        description: "Folder name is required."
      });
      return;
    }

    const authToken = await getAuthToken();
    const login = await getLogin(authToken);
    const requestData = {
      login,
      name,
      parentFolderId: folderId ? String(folderId) : null
    };

    try {
      const response = await fetch("http://localhost:8080/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setModalShow(false);
        setName("");
        setFolders(prev => [...prev, data]);
      } else if (response.status === 409) {
        toast({
          variant: "destructive",
          title: "Name Conflict",
          description: "A folder with that name already exists here."
        });
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "Something went wrong while creating the folder."
      });
    }
  };

  return (
    <>
      <Button variant="outline" className="flex items-center gap-2" onClick={() => setModalShow(true)}>
        <GoFileDirectory className="size-4" />
        Add Folder
      </Button>

      <Dialog open={modalShow} onOpenChange={setModalShow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Name</Label>
              <Input
                id="folderName"
                placeholder="Enter the name of your folder"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalShow(false)}>Cancel</Button>
            <Button onClick={handleModalSave}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
