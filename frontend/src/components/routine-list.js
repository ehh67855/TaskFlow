import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAuthToken, getLogin } from '@/services/BackendService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const RoutineList = ({ routine, networkQuantifier, networkId, setGenererateListShowModal }) => {
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
        setItemTimers(prevTimers => {
          const updated = [...prevTimers];
          if (updated[currentIndex] > 0) {
            updated[currentIndex] = Math.max(updated[currentIndex] - 1000, 0);
          }
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

  useEffect(() => {
    if (currentTimer === 0) {
      setShowModal(true);
      setModalIndex(currentIndex);
    }
  }, [currentTimer, currentIndex]);

  const currentItem = routine.routineItems[currentIndex];

  useEffect(() => {
    setEditedDescription(currentItem?.nodeDescription || '');
  }, [currentIndex, currentItem]);

  const handleActualValueChange = (index, value) => {
    const updated = [...actualValues];
    updated[index] = value;
    setActualValues(updated);
  };

  // const handleModalClose = () => {
  //   setShowModal(false);
  //   if (currentIndex < routine.routineItems.length - 1) {
  //     setCurrentIndex(prev => prev + 1);
  //     setCurrentTimer(routine.routineItems[currentIndex + 1]?.amountOfTime || 0);
  //   } else {
  //     setIsRoutineComplete(true);
  //     sendDataToBackend();
  //   }
  // };

  // const handleSkip = () => {
  //   const remaining = currentTimer;
  //   setTotalTimer(prev => Math.max(prev - remaining, 0));
  //   if (currentIndex < routine.routineItems.length - 1) {
  //     setCurrentIndex(prev => prev + 1);
  //     setCurrentTimer(routine.routineItems[currentIndex + 1]?.amountOfTime || 0);
  //   } else {
  //     setModalIndex(currentIndex);
  //     setShowModal(true);
  //   }
  // };

  const togglePause = () => setIsPaused(prev => !prev);

  const formatTime = ms => {
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(0);
    return `${m}m ${s}s`;
  };

  // const handleRoutineSubmit = async () => {
  //   if (!routine) return;
  //   try {
  //     const authToken = await getAuthToken();
  //     const login = await getLogin(authToken);
  //     const routineItems = routine.routineItems.map((item, idx) => ({
  //       id: item.id,
  //       nodeId: item.nodeId || null,
  //       amountOfTime: item.amountOfTime,
  //       targetValue: item.targetValue,
  //       achievedValue: parseFloat(actualValues[idx]) || 0,
  //     }));
  //     const data = {
  //       login,
  //       networkId,
  //       totalMinutes: Math.ceil(totalRoutineTime / 60000),
  //       routineItems,
  //     };
  //     const res = await fetch('http://localhost:8080/save-routine', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(data),
  //     });
  //     if (!res.ok) throw new Error('Failed to submit routine');
  //     setIsRoutineComplete(true);
  //   } catch (err) {
  //     alert('Failed to submit routine data.');
  //   }
  // };

  const handleSaveDescription = async () => {
    const currentNode = routine.routineItems[currentIndex];
    // Prepare UpdateNodeRequest payload
    const payload = {
      id: String(currentNode.nodeId),
      title: currentNode.itemName,
      priority: String(currentNode.priority ?? 1),
      difficulty: String(currentNode.difficulty ?? 1),
      estimatedMinutes: String(Math.floor((currentNode.amountOfTime || 0) / 60000)),
      estimatedSeconds: String(Math.floor(((currentNode.amountOfTime || 0) % 60000) / 1000)),
      isAreaOfFocus: currentNode.isAreaOfFocus ? 'true' : 'false',
      description: editedDescription,
      networkId: String(networkId)
    };
    try {
      const res = await fetch('http://localhost:8080/update-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update node description');
      routine.routineItems[currentIndex].nodeDescription = editedDescription;
      setIsEditingDescription(false);
    } catch (err) {
      alert('Failed to update description.');
    }
  };

  if (!routine?.routineItems?.length) return <p className="text-center">No routine items available.</p>;

  return (
    <div className="mx-auto p-4 grid grid-cols-1 gap-4 max-w-2xl w-full">
      <h3 className="text-xl font-semibold mb-4">Routine Checklist</h3>

      <div
        key={currentItem.id ?? `routine-item-${currentIndex}`}
        className={`border rounded-xl p-4 mb-3 w-full max-w-lg mx-auto bg-muted`}
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

        <div className="mt-4">
          <Label htmlFor={`actualValue-${currentIndex}`}>{networkQuantifier} Value:</Label>
          <Input
            id={`actualValue-${currentIndex}`}
            type="number"
            value={actualValues[currentIndex]}
            onChange={(e) => handleActualValueChange(currentIndex, e.target.value)}
            // Allow input at any time
            disabled={false}
            className="border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary bg-white"
          />
        </div>

        {/* Start button before timer begins */}
        {!hasStarted && (
          <Button className="mt-4 w-full" onClick={() => setHasStarted(true)}>
            Start
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

      {/* Carousel indicator moved above timers */}
      <div className="flex justify-center items-center gap-2 mb-4 mt-2">
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

      <div className="mt-6">
        <h5>Total Routine Timer</h5>
        <Progress value={(totalTimer / totalRoutineTime) * 100} className="mt-1" />
        <p className="text-sm mt-1">{formatTime(totalTimer)}</p>
      </div>

      <div className="mt-4">
        <h5>Current Item Timer</h5>
        <Progress value={(currentTimer / (currentItem?.amountOfTime || 1)) * 100} className="mt-1" />
        <p className="text-sm mt-1">{formatTime(currentTimer)}</p>
      </div>

      <Button className="mt-4" onClick={togglePause}>
        {isPaused ? 'Resume' : 'Pause'}
      </Button>

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
