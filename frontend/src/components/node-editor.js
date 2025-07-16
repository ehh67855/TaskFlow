import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import ReactMarkdown from 'react-markdown';
import { MDXEditor } from '@/components/ui/markdown-editor';
import StarRatings from 'react-star-ratings';

const NodeEditor = ({ show, handleClose, selectedNode, networkId, handleEditNodeSave }) => {
  const sampleMarkdown = "# Title\n## Enter your description\n```\n1. List Item 1\n2. List Item 2\n```";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(sampleMarkdown);
  const [isEditing, setIsEditing] = useState(true);
  const [priorityRating, setPriorityRating] = useState(1);
  const [difficultyRating, setDifficultyRating] = useState(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const [isAreaOfFocus, setIsAreaOfFocus] = useState(false);

  const checkHandler = () => {
    setIsAreaOfFocus(!isAreaOfFocus);
  };

  const parseISODuration = (duration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    return {
      hours: parseInt(matches[1] || 0),
      minutes: parseInt(matches[2] || 0),
      seconds: parseInt(matches[3] || 0)
    };
  };

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.label === "Inactive" ? "New Node" : selectedNode.title || "");
      setDescription(selectedNode.description || sampleMarkdown);
      setPriorityRating(selectedNode.priority || 1);
      setDifficultyRating(selectedNode.difficulty || 1);
      setIsAreaOfFocus(selectedNode.areaOfFocus || false);

      const durationString = selectedNode.estimatedAmountOfTime;
      if (durationString) {
        const duration = parseISODuration(durationString);
        setEstimatedMinutes(duration.minutes);
        setEstimatedSeconds(duration.seconds);
      } else {
        setEstimatedMinutes(0);
        setEstimatedSeconds(0);
      }
    } else {
      setTitle("");
      setDescription(sampleMarkdown);
      setPriorityRating(1);
      setDifficultyRating(1);
      setIsAreaOfFocus(false);
      setEstimatedMinutes("");
      setEstimatedSeconds("");
    }
  }, [selectedNode]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const estimatedAmountOfTime = `PT${parseInt(estimatedMinutes || 0)}M${parseInt(estimatedSeconds || 0)}S`;
    if (parseInt(estimatedMinutes || 0) + parseInt(estimatedSeconds || 0) <= 0) {
      alert("Please enter an estimated time");
      return;
    }

    const updatedNode = {
      ...selectedNode,
      id: selectedNode.id,
      title,
      priority: priorityRating,
      difficulty: difficultyRating,
      estimatedMinutes: parseInt(estimatedMinutes || 0),
      estimatedSeconds: parseInt(estimatedSeconds || 0),
      estimatedAmountOfTime,
      isAreaOfFocus,
      description,
      networkId
    };

    handleEditNodeSave({ ...updatedNode, label: updatedNode.title });

    fetch(`http://localhost:8080/update-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedNode)
    })
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then((data) => console.log('update data', data))
      .catch((error) => console.log(error));

    handleClose();
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="flex items-center gap-4">
              <span>Priority</span>
              <StarRatings rating={priorityRating} starRatedColor="gold" changeRating={setPriorityRating} numberOfStars={5} name="priority" starDimension="20px" starSpacing="2px" />
            </div>
            <div className="flex items-center gap-4">
              <span>Difficulty</span>
              <StarRatings rating={difficultyRating} starRatedColor="gold" changeRating={setDifficultyRating} numberOfStars={5} name="difficulty" starDimension="20px" starSpacing="2px" />
            </div>

            <div>
              <Label>Estimated Time (MM:SS)</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="Minutes" className="w-20" />
                <span>:</span>
                <Input type="number" value={estimatedSeconds} onChange={(e) => setEstimatedSeconds(e.target.value)} placeholder="Seconds" className="w-20" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="areaOfFocus" checked={isAreaOfFocus} onCheckedChange={checkHandler} />
              <Label htmlFor="areaOfFocus">Area of Focus</Label>
            </div>

            <div>
              <Label>Description (Markdown)</Label>
              <MDXEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter your description in markdown..."
              />
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>View</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{title}</h3>
            <ReactMarkdown>{description}</ReactMarkdown>
            <Button onClick={() => setIsEditing(true)} variant="secondary">Edit</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NodeEditor;
