import React, { useState } from "react";
import { FiMinus, FiMaximize } from "react-icons/fi";
import NodeEditor from "@/components/node-editor";
import ReactMarkdown from 'react-markdown';
import StarRatings from 'react-star-ratings';
import GenerateListButton from "@/components/generate-list-button";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export default function NetworkEditor({
  selectedNode,
  addChild,
  switchType,
  networkName,
  networkQuantifier,
  networkId,
  areaOfFocusNodes,
  handleEditNodeSave
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true); // New state for panel

  const handleMinimize = () => setIsMinimized(!isMinimized);
  const handleEditNodeShow = () => setModalShow(true);
  const handleModalClose = () => setModalShow(false);
  const handlePanelToggle = () => setPanelOpen((open) => !open);

  const parseISODuration = (duration) => {
    if (!duration) return { hours: 0, minutes: 0, seconds: 0 };
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    return {
      hours: parseInt(matches[1] || 0),
      minutes: parseInt(matches[2] || 0),
      seconds: parseInt(matches[3] || 0)
    };
  };

  const renderBody = () => {
    if (!selectedNode) {
      return (
        <div>
          <p><strong>Network Name:</strong> {networkName}</p>
          <p><strong>Network Quantifier:</strong> {networkQuantifier || "Default"}</p>
          <br />
          <GenerateListButton
            networkId={networkId}
            networkQuantifier={networkQuantifier}
            areaOfFocusNodes={areaOfFocusNodes}
          />
        </div>
      );
    }

    const time = parseISODuration(selectedNode.estimatedAmountOfTime);

    return (
      <div>
        <h3>{selectedNode.title}</h3>
        {selectedNode.areaOfFocus && <h5>(Area of Focus)</h5>}
        <div className="max-h-64 overflow-y-auto mb-2">
          <ReactMarkdown>{selectedNode.description}</ReactMarkdown>
        </div>

        {/* Node Stats Section */}
        <div className="text-sm text-muted-foreground mb-2">
          <p><strong>Estimated Time:</strong> {time.minutes} min {time.seconds} sec</p>
          <p><strong>Times Practiced:</strong> {selectedNode.numberOfTimesPracticed}</p>
          <p><strong>Total Time Practiced:</strong> {selectedNode.totalAmountOfTimePracticed ? (typeof selectedNode.totalAmountOfTimePracticed === 'string' ? selectedNode.totalAmountOfTimePracticed : `${Math.floor(selectedNode.totalAmountOfTimePracticed / 60000)} min ${Math.floor((selectedNode.totalAmountOfTimePracticed % 60000) / 1000)} sec`) : '0 min 0 sec'}</p>
          <p><strong>Average (Quantifier):</strong> {selectedNode.average?.toFixed(2)}</p>
          {selectedNode.quantifierValues && selectedNode.quantifierValues.length > 0 && (
            <p><strong>{networkQuantifier} List:</strong> {selectedNode.quantifierValues.map(val => val.toFixed(2)).join(', ')}</p>
          )}
        </div>

        {selectedNode.color !== "#808080" && (
          <>
            <div className="flex items-center mb-3">
              <p className="mr-2">Priority</p>
              <StarRatings
                rating={selectedNode.priority}
                starRatedColor="grey"
                numberOfStars={5}
                name="priority"
                starDimension="20px"
                starSpacing="2px"
                starHoverColor="gold"
              />
            </div>

            <div className="flex items-center mb-4">
              <p className="mr-2">Difficulty</p>
              <StarRatings
                rating={selectedNode.difficulty}
                starRatedColor="grey"
                numberOfStars={5}
                name="difficulty"
                starDimension="20px"
                starSpacing="2px"
                starHoverColor="gold"
              />
            </div>
          </>
        )}

        <CardFooter className="flex justify-between mt-2 p-0 pt-4">
          {selectedNode.color !== "#808080" && (
            <Button onClick={handleEditNodeShow} size="sm">Edit</Button>
          )}

          {selectedNode.color !== "#808080" && (
            <Button onClick={switchType} size="sm" variant="secondary">
              {selectedNode.color === "#FFD166" ? "Make Action" : "Make Category"}
            </Button>
          )}

          <Button onClick={addChild} size="sm" variant="success">Add Child</Button>
        </CardFooter>
      </div>
    );
  };

  return (
    <>
      <NodeEditor
        networkId={networkId}
        show={modalShow}
        handleClose={handleModalClose}
        selectedNode={selectedNode}
        handleEditNodeSave={handleEditNodeSave}
      />
      {/* Modern sliding panel instead of Draggable */}
      <div>
        {/* Toggle button for panel */}
        {!panelOpen && (
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
