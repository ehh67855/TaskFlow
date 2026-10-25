"use client";
import { BACKEND_API_URL } from "@/config/site";
// NetworkPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import VisNetwork from '@/components/vis-network';
import { getAuthToken, getLogin, setAuthHeader } from '@/services/BackendService';
import { ClipLoader } from 'react-spinners';
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { notifyBadgeCheck } from "@/lib/badge-events"
import { downloadNetworkExport } from "@/lib/network-export"
import { toDisplayLabel } from "@/lib/node-types"

export default function NetworkPage() {

  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [networkName, setNetworkName] = useState("");
  const [published, setPublished] = useState(false);
  const [visibleToFriends, setVisibleToFriends] = useState(true);
  // The dashboard's "Preview" menu item links here with ?mode=preview, which opens straight
  // into the read-only marketplace view instead of the editor.
  const initialView = searchParams.get('mode') === 'preview' ? 'preview' : 'graph';

  // Ref to store the cache of edges
  const edgesCache = useRef([]);
  // Needed for the Publish/Unpublish toggle, which fires later (on a button click, not on
  // mount) - kept in a ref rather than re-fetched each time.
  const loginRef = useRef(null);

  // The graph view renders from its own vis-network DataSet, which callers update directly for
  // speed (no React re-render/layout-rebuild needed just to add a node) - but Tree View is a
  // plain React component reading straight from the `nodes`/`edges` state below, so every
  // mutation needs to ALSO land here via a real setState call, or Tree View just never sees it.
  const pushNode = (node) => {
    setNodes(prev => [...prev, node]);
  }

  const pushEdge = (edge) => {
    setEdges(prev => [...prev, edge]);
  }

  const updateNodeInState = (updatedNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? { ...n, ...updatedNode } : n));
  }

  useEffect(() => {
    console.log('Network Rerender');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
  }, [nodes, edges]);

  const fetchNetwork = async () => {

    const authToken = await getAuthToken()
    const login = await getLogin(authToken)
    loginRef.current = login;
    fetch(`${BACKEND_API_URL}/get-network/${id}?login=${encodeURIComponent(login)}`, {

      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 401) {
          // The token that's on this page just outlived its 1-day validity (see
          // UserAuthenticationProvider.createToken) - clear the now-useless cookie before
          // bouncing to login, so the next load doesn't just land right back here.
          setAuthHeader(null).finally(() => { window.location.href = "/login?expired=1"; });
          throw new Error('Token Expired');
        } else if (response.status === 404) {
          window.location.href = "/"
          throw new Error('Forbidden access or doesnt exist');
        }
      })
      .then((data) => {
        setNetworkName(data.name);
        setPublished(data.published);
        setVisibleToFriends(data.visibleToFriends);
        setNodes(data.nodes.map(node => {
          if (node.label === "Root Node") {
            return node;
          }
          if (node.title === "Inactive") {
            return {
              ...node,
              title: "Edit node to activate",
              label: node.title
            };
          }
          return {
            ...node,
            label: toDisplayLabel(node.title)
          };
        }));

        const edgesData = data.edges.map((edge) => ({
          id: edge.id,
          to: edge.to.id,
          from: edge.from.id,
        }));
        setEdges(edgesData);
        edgesCache.current = edgesData;
      })
      .catch((error) => {
        console.log('get-network error', error);
      })
      .finally(() => {
        setLoading(false);
      });

  }



  useEffect(() => {
    fetchNetwork()
  }, [id]);

  const togglePublish = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/publish-network`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, login: loginRef.current, published: !published })
      });
      if (!res.ok) throw new Error('Failed to update marketplace listing');
      const updated = await res.json();
      setPublished(updated.published);
      if (updated.published) notifyBadgeCheck();
    } catch (error) {
      console.error("Failed to toggle marketplace listing:", error);
      toast({
        variant: "destructive",
        title: "Couldn't update the marketplace listing",
        description: "Please try again."
      });
    }
  };

  const toggleVisibleToFriends = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/set-network-visibility`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, login: loginRef.current, visibleToFriends: !visibleToFriends })
      });
      if (!res.ok) throw new Error('Failed to update friends visibility');
      const updated = await res.json();
      setVisibleToFriends(updated.visibleToFriends);
    } catch (error) {
      console.error("Failed to toggle friends visibility:", error);
      toast({
        variant: "destructive",
        title: "Couldn't update this network's visibility to friends",
        description: "Please try again."
      });
    }
  };

  const exportNetwork = () => {
    downloadNetworkExport(networkName, nodes, edges);
  };

  const deleteNode = (nodeData, callback, setSelectedNode) => {
    let node = nodes.find(x => x.id === nodeData.nodes[0]);

    if (node.color && node.color === "#808080") {
      toast({
        title: "Error",
        description: "Cannot delete the root node",
        variant: "destructive",
      });
      callback(null);
      return;
    }

    fetch(`${BACKEND_API_URL}/delete-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: nodeData.nodes[0],
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response;
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (callback)
          callback(nodeData);
        setSelectedNode(null);
        setNodes(prev => prev.filter(n => n.id !== nodeData.nodes[0]));
        // The backend cascade-deletes every edge touching this node - without also dropping
        // them here, they'd linger in state pointing at a node that no longer exists, which
        // breaks Tree View (reads straight from this array) and keyboard navigation (walks
        // edges to find parents/children/siblings).
        setEdges(prev => prev.filter(e => e.from !== nodeData.nodes[0] && e.to !== nodeData.nodes[0]));
      });
  };

  const addEdge = (edgeData, callback) => {
    if (edgeData.to === edgeData.from) {
      callback(null);
      return;
    }

    const edgeExists = edgesCache.current.find(x => (x.from === edgeData.from && x.to === edgeData.to) || (x.from === edgeData.to && x.to === edgeData.from));

    if (edgeExists) {
      toast({
        title: "Duplicate Edge",
        description: "Edge already exists",
        variant: "destructive",
      });
      callback(null);
      return;
    }

    fetch(`${BACKEND_API_URL}/create-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...edgeData,
        networkId: id,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          // The backend is the source of truth for cycle/Root-Node validation (the graph
          // manipulation panel lets you draw an edge from any node to any other, so this is
          // the only place that actually rejects one) - surface whatever reason it gives
          // instead of failing silently.
          const error = await response.json().catch(() => null);
          toast({
            title: "Can't create that edge",
            description: error?.message ?? "Something went wrong. Please try again.",
            variant: "destructive",
          });
          if (callback) callback(null);
          return;
        }

        const data = await response.json();
        let newEdge = {
          id: data.id,
          to: data.to.id,
          from: data.from.id,
        };

        edgesCache.current = [...edgesCache.current, newEdge];
        pushEdge(newEdge);

        if (callback)
          callback(newEdge);
      })
      .catch((error) => {
        console.log(error);
        // Unlike the other node/edge mutators, this one never reaches a .finally() that
        // could call the callback unconditionally - without this, a caller awaiting the
        // callback (undo/redo replaying an edge creation) would hang forever on a network
        // failure instead of seeing the rejection.
        if (callback)
          callback(null);
      });
  };

  const deleteEdge = (edgeData, callback) => {
    fetch(`${BACKEND_API_URL}/delete-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: edgeData.edges[0],
      }),
    })
      .then(response => {
        edgesCache.current = edgesCache.current.filter(edge => edge.id !== edgeData.edges[0]);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (callback)
          callback(edgeData);
        setEdges(prev => prev.filter(e => e.id !== edgeData.edges[0]));
      });
  };

  const editEdge = (edgeData, callback) => {
    fetch(`${BACKEND_API_URL}/edit-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...edgeData,
        networkId: id,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Reconnecting an edge (dragging its endpoint) goes through this same validation as
          // creating one - it can just as easily be dragged into the Root Node or into closing
          // a cycle. Previously this branch fell straight to .finally() below and applied the
          // edit to local state regardless, silently desyncing the graph from what the backend
          // actually saved.
          const error = await response.json().catch(() => null);
          toast({
            title: "Can't move that edge",
            description: error?.message ?? "Something went wrong. Please try again.",
            variant: "destructive",
          });
          if (callback) callback(null);
          return;
        }

        if (callback)
          callback(edgeData);
        setEdges(prev => prev.map(e => e.id === edgeData.id ? { ...e, ...edgeData } : e));
      })
      .catch((error) => {
        console.log(error);
        if (callback)
          callback(null);
      });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <ClipLoader color="#3498db" loading={loading} size={150} />
    </div>;
  }

  return (
    <div className="h-screen">
      <Toaster />
      <VisNetwork
        networkId={id}
        networkName={networkName}
        nodes={nodes}
        edges={edges}
        deleteNode={deleteNode}
        addEdge={addEdge}
        deleteEdge={deleteEdge}
        editEdge={editEdge}
        pushNode={pushNode}
        pushEdge={pushEdge}
        updateNodeInState={updateNodeInState}
        published={published}
        onTogglePublish={togglePublish}
        visibleToFriends={visibleToFriends}
        onToggleVisibleToFriends={toggleVisibleToFriends}
        onExport={exportNetwork}
        initialView={initialView}
      />
    </div>
  );
}
