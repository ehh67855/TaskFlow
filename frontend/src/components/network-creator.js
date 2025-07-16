"use client"

import React, { useState } from 'react';
import { getAuthToken, getLogin } from '@/services/BackendService';
import { GoPlus } from "react-icons/go";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
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

export default function NetworkCreator({ setNetworks = () => window.location.reload() }) {
  const [modalShow, setModalShow] = useState(false);
  const [formData, setFormData] = useState({ name: "", quantifier: "" });
  const [importedData, setImportedData] = useState({ nodes: [], edges: [] });
  const { toast } = useToast();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setImportedData(data);
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Invalid JSON",
            description: "Please check the file content."
          });
        }
      };
      reader.readAsText(file);
    }
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
      quantifier: formData.quantifier,
      nodes: importedData.nodes,
      edges: importedData.edges
    };

    try {
      const response = await fetch("http://localhost:8080/create-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setModalShow(false);
        setNetworks(prev => [...prev, data]);
      } else if (response.status === 409) {
        toast({
          variant: "destructive",
          title: "Name Conflict",
          description: "Network name already in use."
        });
        setModalShow(false);
      } else {
        throw new Error('Network response was not ok.');
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
          <Dialog open={modalShow} onOpenChange={setModalShow}>
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
                  <Label htmlFor="quantifier">
                    Custom Quantifier <span className="text-sm text-muted-foreground">(Recommended)</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 px-2 py-0 text-xs"
                        >
                          ?
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        A Custom Quantifier is a specific metric you choose to track and improve your progress.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="quantifier"
                    name="quantifier"
                    placeholder="i.e. Beats Per Minute, Repetitions, etc..."
                    value={formData.quantifier}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="importFile">Import Network</Label>
                  <Input id="importFile" type="file" size="sm" onChange={handleFileChange} />
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
