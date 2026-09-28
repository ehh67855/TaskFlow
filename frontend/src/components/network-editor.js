import React, { useEffect, useState } from "react";
import { FiMinus, FiMaximize } from "react-icons/fi";
import { Store, Scissors, Users, UserX, Download } from "lucide-react";
import NodeEditor from "@/components/node-editor";
import ReactMarkdown from 'react-markdown';
import GenerateListButton from "@/components/generate-list-button";
import SplitNetworkDialog from "@/components/split-network-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

// Mirrors the Action -> Category -> Info -> Action cycle switchType (vis-network.js) actually
// performs - this only decides the button's label (what clicking it will make the node), so
// keeping the two in sync matters even though the cycle logic itself lives elsewhere.
const NEXT_TYPE_LABEL = {
  "#7FC6A4": "Make Category",
  "#FFD166": "Make Info",
  "#6FA8DC": "Make Action",
};

export default function NetworkEditor({
  selectedNode,
  addChild,
  switchType,
  networkName,
  networkId,
  areaOfFocusNodes,
  handleEditNodeSave,
  modalShow,
  minimizeForModal,
  onEditShow,
  onEditClose,
  published,
  onTogglePublish,
  visibleToFriends,
  onToggleVisibleToFriends,
  onExport,
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true); // New state for panel
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);

  const handleMinimize = () => setIsMinimized(!isMinimized);
  // The edit dialog and the control panel can otherwise overlap on a small window with no
  // way to get the panel out of the way (it sits above the dialog), so the panel is always
  // minimized while any node dialog is open (editing OR creating a new one, since both use
  // the same NodeEditor dialog) and reopens once you're done - whatever actually opened it
  // (this panel's own Edit/Add Child buttons, double-clicking a node, or the graph's own
  // Add Node tool).
  useEffect(() => {
    setPanelOpen(!(minimizeForModal || splitDialogOpen));
  }, [minimizeForModal, splitDialogOpen]);
  // Blocked while a dialog's open so the panel can't be brought back over it.
  const handlePanelToggle = () => {
    if (minimizeForModal || splitDialogOpen) return;
    setPanelOpen((open) => !open);
  };

  const renderBody = () => {
    if (!selectedNode) {
      return (
        <div>
          <p><strong>Network Name:</strong> {networkName}</p>
          <br />
          <GenerateListButton
            networkId={networkId}
            areaOfFocusNodes={areaOfFocusNodes}
          />

          <CardFooter className="p-0 pt-4 flex flex-col items-stretch gap-2">
            <Button
              onClick={onTogglePublish}
              size="sm"
              variant={published ? "secondary" : "default"}
              className="flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              {published ? "Unpublish from Marketplace" : "Publish to Marketplace"}
            </Button>
            <Button
              onClick={onToggleVisibleToFriends}
              size="sm"
              variant={visibleToFriends ? "outline" : "secondary"}
              className="flex items-center gap-2"
            >
              {visibleToFriends ? <UserX className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {visibleToFriends ? "Hide from Friends" : "Share with Friends"}
            </Button>
            <Button
              onClick={onExport}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </Button>
          </CardFooter>
        </div>
      );
    }

    return (
      <div>
        <h3>{selectedNode.title}</h3>
        <div className="max-h-64 overflow-y-auto mb-2">
          <ReactMarkdown>{selectedNode.description}</ReactMarkdown>
        </div>

        <CardFooter className="flex flex-wrap gap-2 justify-between mt-2 p-0 pt-4">
          {selectedNode.color !== "#808080" && (
            <Button onClick={onEditShow} size="sm">Edit</Button>
          )}

          {selectedNode.color !== "#808080" && (
            <Button onClick={switchType} size="sm" variant="secondary">
              {NEXT_TYPE_LABEL[selectedNode.color] || "Make Category"}
            </Button>
          )}

          <Button onClick={addChild} size="sm" variant="success">Add Child</Button>

          {(selectedNode.color === "#FFD166" || selectedNode.color === "#6FA8DC") && (
            <Button onClick={() => setSplitDialogOpen(true)} size="sm" variant="outline" className="flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              Split into New Network
            </Button>
          )}
        </CardFooter>
      </div>
    );
  };

  return (
    <>
      <NodeEditor
        networkId={networkId}
        show={modalShow}
        handleClose={onEditClose}
        selectedNode={selectedNode}
        handleEditNodeSave={handleEditNodeSave}
      />
      <SplitNetworkDialog
        open={splitDialogOpen}
        onOpenChange={setSplitDialogOpen}
        node={selectedNode}
        onSplit={(newNetwork) => { window.location.href = `/network/${newNetwork.id}`; }}
      />
      {/* Modern sliding panel instead of Draggable */}
      <div>
        {/* Toggle button for panel */}
        {!panelOpen && !minimizeForModal && !splitDialogOpen && (
          <Button
            className="fixed top-8 right-2 z-[9999] shadow-lg bg-card border border-border"
            variant="outline"
            size="icon"
            onClick={handlePanelToggle}
          >
            <FiMaximize size={20} />
          </Button>
        )}
        <div
          className={`fixed top-8 right-2 w-80 z-[9999] transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none opacity-0"
          }`}
        >
          <Card className="bg-card border border-border shadow-lg text-foreground">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-base">Control Panel</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleMinimize}>
                  {isMinimized ? <FiMaximize size={20} /> : <FiMinus size={20} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePanelToggle}>
                  <span className="sr-only">Close</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
              </div>
            </CardHeader>
            {!isMinimized && <CardContent>{renderBody()}</CardContent>}
          </Card>
        </div>
      </div>
    </>
  );
}
