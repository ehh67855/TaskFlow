import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import ReactMarkdown from 'react-markdown';
import { MDXEditor } from '@/components/ui/markdown-editor';
import StarRatings from 'react-star-ratings';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ACTION_COLOR = '#7FC6A4';
const CATEGORY_COLOR = '#FFD166';
// A leaf node that's just reference material (e.g. music theory notes), not something to
// practice - excluded from routine generation server-side the same way Category nodes are.
const INFO_COLOR = '#6FA8DC';
const DRAFT_KEY_PREFIX = 'nodeDraft:';

const parseISODuration = (duration) => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  return {
    hours: parseInt(matches[1] || 0),
    minutes: parseInt(matches[2] || 0),
    seconds: parseInt(matches[3] || 0)
  };
};

// What the form would show for this node with nothing unsaved - the baseline that "is there
// unsaved work?" gets compared against, and what a draft is compared against too (a draft that
// matches this exactly isn't worth keeping around).
const snapshotFromNode = (node) => {
  if (!node) {
    return {
      title: "", description: "", nodeType: ACTION_COLOR, priorityRating: 0, difficultyRating: 0,
      estimatedMinutes: "", estimatedSeconds: "", isAreaOfFocus: false, quantifierLabel: ""
    };
  }
  const duration = node.estimatedAmountOfTime ? parseISODuration(node.estimatedAmountOfTime) : null;
  // Anything other than a recognized type falls back to Action - but that fallback must never
  // silently swallow a real type. This used to compare against CATEGORY_COLOR only, which
  // meant re-opening an existing Info node here would show "Action" selected, and saving
  // without touching the type picker would quietly convert it.
  const knownType = node.color === CATEGORY_COLOR || node.color === INFO_COLOR ? node.color : ACTION_COLOR;
  return {
    title: node.label === "Inactive" ? "" : node.title || "",
    description: node.description || "",
    nodeType: knownType,
    priorityRating: node.priority || 0,
    difficultyRating: node.difficulty || 0,
    estimatedMinutes: duration ? duration.minutes : "",
    estimatedSeconds: duration ? duration.seconds : "",
    isAreaOfFocus: node.areaOfFocus || false,
    quantifierLabel: node.quantifierLabel || "",
  };
};

// selectedNode present = editing that existing node. selectedNode absent (but show=true) =
// creating a brand-new one - nothing is persisted, or shown anywhere in the app, unless this
// form is actually submitted. parentNodeId (create mode only) links the new node to its
// parent with an edge, created atomically with the node itself.
const NodeEditor = ({ show, handleClose, selectedNode, parentNodeId, networkId, handleEditNodeSave, onNodeCreated }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [nodeType, setNodeType] = useState(ACTION_COLOR);
  const [priorityRating, setPriorityRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [estimatedSeconds, setEstimatedSeconds] = useState("");
  const [isAreaOfFocus, setIsAreaOfFocus] = useState(false);
  const [quantifierLabel, setQuantifierLabel] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // What's actually saved on the backend for whichever node is currently loaded - used to
  // tell "unsaved changes" apart from "matches what's already saved", both for deciding
  // whether a draft is worth keeping and whether to warn before leaving the page. Only
  // meaningful in edit mode - a node being created has nothing "saved" to compare against.
  const baselineRef = useRef(snapshotFromNode(null));

  const checkHandler = () => {
    setIsAreaOfFocus(!isAreaOfFocus);
  };

  // Restores in-progress edits for this node if the editor (or the whole page) was closed
  // before hitting Save - work in a node editor should never just vanish because the tab got
  // refreshed. Keyed by node id, so it doesn't matter whether you come back to it a minute
  // later or after a full reload. Only applies to editing an existing node - a node being
  // created has no id to key a draft on, and per how creation now works, abandoning it before
  // Save is supposed to mean it never existed, so there's nothing to restore there anyway.
  useEffect(() => {
    // Guards against a stale reset: in create mode, selectedNode is always null, so its
    // identity never changes between one "New Node" dialog and the next - without also
    // keying on `show`, this wouldn't rerun on the second open and whatever was typed (or
    // left over) from the first creation would still be sitting in the form fields.
    if (!show) return;

    const fresh = snapshotFromNode(selectedNode);
    baselineRef.current = fresh;

    let toApply = fresh;
    if (selectedNode) {
      try {
        const saved = localStorage.getItem(`${DRAFT_KEY_PREFIX}${selectedNode.id}`);
        if (saved) toApply = JSON.parse(saved);
      } catch (e) {
        console.warn('Could not read saved draft for this node, ignoring it.', e);
      }
    }

    setTitle(toApply.title);
    setDescription(toApply.description);
    setNodeType(toApply.nodeType);
    setPriorityRating(toApply.priorityRating);
    setDifficultyRating(toApply.difficultyRating);
    setEstimatedMinutes(toApply.estimatedMinutes);
    setEstimatedSeconds(toApply.estimatedSeconds);
    setIsAreaOfFocus(toApply.isAreaOfFocus);
    setQuantifierLabel(toApply.quantifierLabel);
    setAdvancedOpen(Boolean(
      toApply.priorityRating > 0 || toApply.difficultyRating > 0 ||
      toApply.estimatedMinutes !== "" || toApply.estimatedSeconds !== "" ||
      toApply.isAreaOfFocus || toApply.quantifierLabel
    ));
  }, [selectedNode, show]);

  // Keeps the draft in localStorage current as you type, and warns before an accidental
  // refresh/close/navigation while there's unsaved work. Both keyed off the same "does the
  // form differ from what's actually saved" check, so they're combined into one effect.
  useEffect(() => {
    if (!show || !selectedNode) return undefined;

    const current = {
      title, description, nodeType, priorityRating, difficultyRating,
      estimatedMinutes, estimatedSeconds, isAreaOfFocus, quantifierLabel
    };
    const key = `${DRAFT_KEY_PREFIX}${selectedNode.id}`;
    const dirty = JSON.stringify(current) !== JSON.stringify(baselineRef.current);

    if (dirty) {
      localStorage.setItem(key, JSON.stringify(current));
    } else {
      localStorage.removeItem(key);
    }

    if (!dirty) return undefined;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [show, selectedNode, title, description, nodeType, priorityRating, difficultyRating, estimatedMinutes, estimatedSeconds, isAreaOfFocus, quantifierLabel]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ variant: "destructive", title: "Please enter a title" });
      return;
    }

    const hasTime = estimatedMinutes !== "" || estimatedSeconds !== "";
    const estimatedAmountOfTime = hasTime
      ? `PT${parseInt(estimatedMinutes || 0)}M${parseInt(estimatedSeconds || 0)}S`
      : null;

    if (!selectedNode) {
      // Creating a brand-new node. Unlike editing, this can't be optimistic - there's no id
      // for anything (graph, tree, local state) to reference until the backend actually
      // assigns one, so nothing is added anywhere until this request succeeds. If it fails,
      // the dialog stays open with everything still typed in, rather than losing it.
      const payload = {
        id: null,
        parentNodeId: parentNodeId || null,
        title,
        label: title,
        color: nodeType,
        priority: priorityRating > 0 ? priorityRating : null,
        difficulty: difficultyRating > 0 ? difficultyRating : null,
        estimatedMinutes: hasTime ? parseInt(estimatedMinutes || 0) : null,
        estimatedSeconds: hasTime ? parseInt(estimatedSeconds || 0) : null,
        isAreaOfFocus,
        description: description || null,
        quantifierLabel: quantifierLabel.trim(),
        networkId
      };

      setIsSaving(true);
      fetch(`http://localhost:8080/save-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => res.ok ? res.json() : Promise.reject(res.status))
        .then((data) => {
          onNodeCreated(data.node, data.edge);
          handleClose();
        })
        .catch((error) => {
          console.log(error);
          toast({ variant: "destructive", title: "Failed to create this node.", description: "Please try again." });
        })
        .finally(() => setIsSaving(false));
      return;
    }

    // Local/optimistic state always keeps numeric priority/difficulty (0 = unset), matching
    // what the backend actually stores - a node whose rating was never set has an int default
    // of 0, never null. Star-rating UI elsewhere reads selectedNode.priority/.difficulty
    // directly and breaks on null (react-star-ratings calls rating.toFixed internally).
    const updatedNode = {
      ...selectedNode,
      id: selectedNode.id,
      title,
      label: title,
      color: nodeType,
      priority: priorityRating,
      difficulty: difficultyRating,
      estimatedAmountOfTime,
      isAreaOfFocus,
      description,
      quantifierLabel: quantifierLabel.trim() || null,
      networkId
    };

    handleEditNodeSave(updatedNode);
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedNode.id}`);

    // The backend payload uses null to mean "leave the existing value alone" for fields the
    // user left untouched, so it's built separately from the optimistic local node above.
    const payload = {
      ...updatedNode,
      priority: priorityRating > 0 ? priorityRating : null,
      difficulty: difficultyRating > 0 ? difficultyRating : null,
      estimatedMinutes: hasTime ? parseInt(estimatedMinutes || 0) : null,
      estimatedSeconds: hasTime ? parseInt(estimatedSeconds || 0) : null,
      // Sent as a (possibly empty) string, not null - the backend uses non-null-ness to
      // decide whether to touch this field at all, so an empty string is how "the user
      // cleared it" gets distinguished from "the user never opened this section".
      quantifierLabel: quantifierLabel.trim()
    };

    fetch(`http://localhost:8080/save-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
          <DialogTitle>{selectedNode ? "Edit Node" : "New Node"}</DialogTitle>
        </DialogHeader>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={nodeType === ACTION_COLOR ? "default" : "outline"}
                  onClick={() => setNodeType(ACTION_COLOR)}
                >
                  Action
                </Button>
                <Button
                  type="button"
                  variant={nodeType === CATEGORY_COLOR ? "default" : "outline"}
                  onClick={() => setNodeType(CATEGORY_COLOR)}
                >
                  Category
                </Button>
                <Button
                  type="button"
                  variant={nodeType === INFO_COLOR ? "default" : "outline"}
                  onClick={() => setNodeType(INFO_COLOR)}
                >
                  Info
                </Button>
              </div>
            </div>

            <div>
              <Label>Description (Markdown)</Label>
              <MDXEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter your description in markdown..."
              />
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="flex items-center gap-1 px-0">
                  {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  Advanced Options
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
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
                  <p className="text-sm text-muted-foreground mt-1">Optional - if left blank, routines will estimate a reasonable duration for this item.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="areaOfFocus" checked={isAreaOfFocus} onCheckedChange={checkHandler} />
                  <Label htmlFor="areaOfFocus">Area of Focus</Label>
                </div>

                <div>
                  <Label htmlFor="quantifierLabel">Track a Value (optional)</Label>
                  <Input
                    id="quantifierLabel"
                    value={quantifierLabel}
                    onChange={(e) => setQuantifierLabel(e.target.value)}
                    placeholder="e.g. BPM, reps, seconds held..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    If set, you&apos;ll be asked to enter a {quantifierLabel.trim() || "value"} for this item when you practice it.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Creating..." : selectedNode ? "Save" : "Create"}
              </Button>
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
