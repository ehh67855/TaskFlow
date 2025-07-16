"use client"

import React, { useEffect, useState } from 'react';
import { getAuthToken, getLogin } from "@/services/BackendService";
import NetworkCreator from '../../../components/network-creator.js';

import { GoTrash, GoPencil, GoPlus } from "react-icons/go";
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [networks, setNetworks] = useState([{}]);

  const fetchUserData = async () => {
    try {
      const authToken = await getAuthToken()
      const login = await getLogin(authToken);
      const response = await fetch(`http://localhost:8080/getUserNetworksByLogin/${login}`, {
        method: "GET"
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setNetworks(data);
    } catch (error) {
      console.error("Failed to fetch user networks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    console.log(networks)
  }, [networks]);

  const deleteNetwork = async (id) => {
    if (confirm("Are you sure you want to delete this network? All of its contents will be lost.")) {
      try {
        await fetch(`http://localhost:8080/delete-network/${id}`, {
          method: "POST",
          headers: { "content-type": "application/json" }
        });
        setNetworks(networks.filter(network => network.id !== id));
      } catch (error) {
        console.error("Failed to delete network:", error);
      }
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold text-center mt-10">Loading...</h1>;
  }

  if (networks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 relative">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <Alert variant="default">You currently have no networks. Create one now!</Alert>
        <br />
        <NetworkCreator setNetworks={setNetworks}/> 
        
        {/* FAB-style Create Button */}
        <Button
          className="fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg hover:scale-105 transition"
          onClick={() => {
            document.getElementById("network-creator")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <GoPlus className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-4 relative">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div id="network-creator">
          <NetworkCreator setNetworks={setNetworks} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {networks.map((network, index) => (
            <Card key={index} className="custom-card shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4 p-4">
                <CardTitle className="text-center text-lg font-semibold">{network.name}</CardTitle>
                <MiniNetwork nodes={network.nodes} edges={network.edges} />

                <div className="flex justify-center gap-3 mt-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2 transition-all duration-150 hover:scale-[1.03]"
                        onClick={() => deleteNetwork(network.id)}
                      >
                        <GoTrash className="w-4 h-4" />
                        <span>Delete</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete this network permanently</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 transition-all duration-150 hover:scale-[1.03]"
                        asChild
                      >
                        <a href={`/network/${network.id}`}>
                          <GoPencil className="w-4 h-4" />
                          <span>Edit</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit this network</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Floating Create Button (FAB) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg hover:scale-105 transition"
              onClick={() => {
                document.getElementById("network-creator")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <GoPlus className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create a new network</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
