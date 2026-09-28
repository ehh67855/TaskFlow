import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAuthToken, getLogin } from '@/services/BackendService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import StarRatings from 'react-star-ratings';

const RoutineList = ({ routine, networkId, setGenererateListShowModal, onRoutineComplete }) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(routine?.routineItems[0]?.amountOfTime || 0);
  const totalRoutineTime = routine?.routineItems?.reduce(
    (acc, item) => acc + parseInt(item.amountOfTime || 0, 10),
    0
  );
  const [totalTimer, setTotalTimer] = useState(totalRoutineTime || 0);
  const [actualValues, setActualValues] = useState(new Array(routine?.routineItems?.length || 0).fill(''));
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isRoutineComplete, setIsRoutineComplete] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Optional "how did that go?" prompt shown after finishing an item (either the timer running
  // out or the user marking it done early) - lets them update priority/difficulty/area of
  // focus/estimated time, prefilled with what they already had and how long it actually took.
  const [postPriority, setPostPriority] = useState(0);
  const [postDifficulty, setPostDifficulty] = useState(0);
  const [postAreaOfFocus, setPostAreaOfFocus] = useState(false);
  const [postMinutes, setPostMinutes] = useState('');
  const [postSeconds, setPostSeconds] = useState('');

  // Store a timer for each item
  const [itemTimers, setItemTimers] = useState(
    routine?.routineItems?.map(item => item.amountOfTime || 0) || []
  );

  // Track if the timer for the current item has started
  const [hasStarted, setHasStarted] = useState(false);

  // Reset hasStarted when changing items
  useEffect(() => {
    setHasStarted(false);
  }, [currentIndex]);

  // Update currentTimer to reflect the timer for the current item
  useEffect(() => {
    setCurrentTimer(itemTimers[currentIndex] || 0);
  }, [currentIndex]);

  useEffect(() => {
    if (!routine || !routine.routineItems || routine.routineItems.length === 0) return;

    let timer;
    if (!isPaused && !showModal && !isRoutineComplete && hasStarted) {
      timer = setInterval(() => {
        // Deliberately allowed to go negative once time runs out - the timer running out
        // should never force the user to stop and end the item; it should just keep ticking
        // (as "overtime") until they mark it complete themselves. This also keeps the "how
        // long did this actually take" tracking accurate for items that run long.
        setItemTimers(prevTimers => {
          const updated = [...prevTimers];
          updated[currentIndex] = (updated[currentIndex] ?? 0) - 1000;
          return updated;
        });
        setTotalTimer(prev => Math.max(prev - 1000, 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, showModal, currentIndex, isRoutineComplete, hasStarted]);

  // Keep currentTimer in sync with itemTimers
  useEffect(() => {
    setCurrentTimer(itemTimers[currentIndex] || 0);
  }, [itemTimers, currentIndex]);

  const currentItem = routine.routineItems[currentIndex];
  const modalItem = routine.routineItems[modalIndex];
  const elapsedMs = Math.max((modalItem?.amountOfTime || 0) - (itemTimers[modalIndex] || 0), 0);

  useEffect(() => {
    setEditedDescription(currentItem?.nodeDescription || '');
  }, [currentIndex, currentItem]);

  // Prefill the post-practice form with the item's current values and how long it actually
  // took. itemTimers is intentionally left out of the deps - the ticking effect already pauses
  // while showModal is true, so its value is stable for the duration this prompt is open.
  useEffect(() => {
    if (!showModal || !modalItem) return;
    setPostPriority(modalItem.priority || 0);
    setPostDifficulty(modalItem.difficulty || 0);
    setPostAreaOfFocus(modalItem.areaOfFocus || false);
    const elapsed = Math.max((modalItem.amountOfTime || 0) - (itemTimers[modalIndex] || 0), 0);
    setPostMinutes(String(Math.floor(elapsed / 60000)));
    setPostSeconds(String(Math.floor((elapsed % 60000) / 1000)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, modalIndex]);

  const handleActualValueChange = (index, value) => {
    const updated = [...actualValues];
    updated[index] = value;
    setActualValues(updated);
  };

  const togglePause = () => setIsPaused(prev => !prev);

  const formatTime = ms => {
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(0);
    return `${m}m ${s}s`;
  };

  const handleMarkComplete = () => {
    setModalIndex(currentIndex);
    setShowModal(true);
  };

  const advanceAfterModal = (fromIndex) => {
    setShowModal(false);
    if (fromIndex >= routine.routineItems.length - 1) {
      setIsRoutineComplete(true);
    } else {
      setCurrentIndex(fromIndex + 1);
    }
  };

  const handleSkipPostPractice = () => advanceAfterModal(modalIndex);

  const handlePostPracticeSave = async () => {
    const item = routine.routineItems[modalIndex];
    const hasTime = postMinutes !== '' || postSeconds !== '';
    const payload = {
      id: String(item.nodeId),
      networkId: String(networkId),
      title: item.itemName,
      priority: postPriority > 0 ? String(postPriority) : null,
      difficulty: postDifficulty > 0 ? String(postDifficulty) : null,
      estimatedMinutes: hasTime ? String(parseInt(postMinutes || 0, 10)) : null,
      estimatedSeconds: hasTime ? String(parseInt(postSeconds || 0, 10)) : null,
      isAreaOfFocus: postAreaOfFocus ? 'true' : 'false',
      description: item.nodeDescription
    };
    try {
      const res = await fetch('http://localhost:8080/save-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update node');
      item.priority = postPriority;
      item.difficulty = postDifficulty;
      item.areaOfFocus = postAreaOfFocus;
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update this item." });
    } finally {
      advanceAfterModal(modalIndex);
    }
  };

  const handleSaveDescription = async () => {
    const currentNode = routine.routineItems[currentIndex];
    // Prepare UpdateNodeRequest payload
    const payload = {
      id: String(currentNode.nodeId),
      title: currentNode.itemName,
      priority: String(currentNode.priority || 0),
      difficulty: String(currentNode.difficulty || 0),
      estimatedMinutes: String(Math.floor((currentNode.amountOfTime || 0) / 60000)),
      estimatedSeconds: String(Math.floor(((currentNode.amountOfTime || 0) % 60000) / 1000)),
      isAreaOfFocus: currentNode.areaOfFocus ? 'true' : 'false',
      description: editedDescription,
      networkId: String(networkId)
    };
    try {
      const res = await fetch('http://localhost:8080/save-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update node description');
      routine.routineItems[currentIndex].nodeDescription = editedDescription;
      setIsEditingDescription(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update description." });
    }
  };

  useEffect(() => {
    onRoutineComplete(actualValues)
  }, actualValues);

  // When routine is complete, call onRoutineComplete with achieved values
  useEffect(() => {
    if (isRoutineComplete && typeof onRoutineComplete === 'function') {
      onRoutineComplete(actualValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoutineComplete]);

  if (!routine?.routineItems?.length) return <p className="text-center">No routine items available.</p>;

  return (
    <div className="mx-auto p-4 max-w-2xl w-full h-full max-h-screen overflow-hidden flex flex-col">
      <h3 className="text-xl font-semibold mb-4 flex-shrink-0">Routine Checklist</h3>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div
          key={currentItem.id ?? `routine-item-${currentIndex}`}
          className={`border rounded-xl p-4 w-full max-w-lg mx-auto bg-muted`}
        >
          <p className="font-bold">Item {currentIndex + 1}: {currentItem.itemName}</p>

          {isEditingDescription ? (
            <div className="mt-2">
              <Label htmlFor={`editDescription-${currentIndex}`}>Edit Description:</Label>
              <textarea
                id={`editDescription-${currentIndex}`}
                className="w-full border rounded p-2 mt-1"
                rows={4}
                value={editedDescription}
                onChange={e => setEditedDescription(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="default"
                  onClick={handleSaveDescription}
                >
                  Save
                </Button>
                <Button variant="secondary" onClick={() => {
                  setEditedDescription(currentItem.nodeDescription || '');
                  setIsEditingDescription(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost">
                    {isDescriptionOpen ? 'Hide Description' : 'View Description'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentItem.nodeDescription}</ReactMarkdown>
                </CollapsibleContent>
              </Collapsible>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setIsEditingDescription(true)}>
                Edit Description
              </Button>
            </>
          )}

          {currentItem.quantifierLabel && (
            <div className="mt-4">
              <Label htmlFor={`actualValue-${currentIndex}`}>{currentItem.quantifierLabel}:</Label>
              <Input
                id={`actualValue-${currentIndex}`}
                type="number"
                value={actualValues[currentIndex]}
                onChange={(e) => handleActualValueChange(currentIndex, e.target.value)}
                className="border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Start button before timer begins */}
          {!hasStarted && (
            <Button className="mt-4 w-full" onClick={() => setHasStarted(true)}>
              Start
            </Button>
          )}

          {hasStarted && (
            <Button className="mt-4 w-full" variant="success" onClick={handleMarkComplete}>
              Mark Complete
            </Button>
          )}

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, routine.routineItems.length - 1))}
              disabled={currentIndex === routine.routineItems.length - 1}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Carousel indicator */}
        <div className="flex justify-center items-center gap-2">
          {routine.routineItems.map((_, idx) => (
            <span
              key={idx}
              className={`inline-block w-3 h-3 rounded-full border border-gray-400 transition-all duration-200 ${
                idx === currentIndex ? 'bg-primary border-primary ring-2 ring-primary' : 'bg-gray-200'
              }`}
              aria-label={`Step ${idx + 1}`}
            />
          ))}
          <span className="ml-4 text-xs text-gray-500">{currentIndex + 1} / {routine.routineItems.length}</span>
        </div>

        {/* Timers */}
        <div className="space-y-4">
          <div>
            <h5>Total Routine Timer</h5>
            <Progress value={(totalTimer / totalRoutineTime) * 100} className="mt-1" />
            <p className="text-sm mt-1">{formatTime(totalTimer)}</p>
          </div>

          <div>
            <h5>Current Item Timer</h5>
            <Progress
              value={Math.min(100, Math.max(0, (currentTimer / (currentItem?.amountOfTime || 1)) * 100))}
              className="mt-1"
            />
            <p className={`text-sm mt-1 ${currentTimer < 0 ? 'text-amber-600 font-medium' : ''}`}>
              {currentTimer < 0 ? `Over by ${formatTime(-currentTimer)} - keep going if you're not done` : formatTime(currentTimer)}
            </p>
          </div>

          <Button className="w-full" onClick={togglePause}>
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleSkipPostPractice(); }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Nice work!</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p>
              You spent <strong>{formatTime(elapsedMs)}</strong> on &ldquo;{modalItem?.itemName}&rdquo;.
            </p>
            <p className="text-sm text-muted-foreground">
              Want to update this item&apos;s info? Totally optional.
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="postAreaOfFocus"
                checked={postAreaOfFocus}
                onCheckedChange={() => setPostAreaOfFocus((v) => !v)}
              />
              <Label htmlFor="postAreaOfFocus">Area of Focus</Label>
            </div>

            <div className="flex items-center gap-4">
              <span>Priority</span>
              <StarRatings rating={postPriority} starRatedColor="gold" changeRating={setPostPriority} numberOfStars={5} name="postPriority" starDimension="18px" starSpacing="2px" />
            </div>
            <div className="flex items-center gap-4">
              <span>Difficulty</span>
              <StarRatings rating={postDifficulty} starRatedColor="gold" changeRating={setPostDifficulty} numberOfStars={5} name="postDifficulty" starDimension="18px" starSpacing="2px" />
            </div>

            <div>
              <Label>Estimated Time (MM:SS)</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" value={postMinutes} onChange={(e) => setPostMinutes(e.target.value)} placeholder="Minutes" className="w-20" />
                <span>:</span>
                <Input type="number" value={postSeconds} onChange={(e) => setPostSeconds(e.target.value)} placeholder="Seconds" className="w-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Prefilled with how long this actually took you.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePostPracticeSave}>Save &amp; Continue</Button>
            <Button variant="secondary" onClick={handleSkipPostPractice}>Continue without saving</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoutineComplete} onOpenChange={setIsRoutineComplete}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Routine Complete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">You have completed the routine!</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRoutineComplete(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutineList;
