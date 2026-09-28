import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RoutineList from "@/components/routine-list";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { notifyBadgeCheck } from "@/lib/badge-events";
import { useToast } from "@/hooks/use-toast";

export default function GenerateListButton({ networkId, areaOfFocusNodes = [], handleEditNodeSave }) {
  const [showModal, setShowModal] = useState(false);
  const [generateClicked, setGenerateClicked] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [achievedValues, setAchievedValues] = useState([]); // New state
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const { toast } = useToast();

  const closeAndReset = () => {
    setShowModal(false);
    setConfirmExitOpen(false);
    setGenerateClicked(false);
    setErrorMessage("");
  };

  // Mid-routine, closing needs a confirmation first (there's real progress to lose) - anything
  // that would otherwise close the dialog (the Close button, Escape, clicking the overlay)
  // routes through here instead of closing directly.
  const handleClose = () => {
    if (generateClicked) {
      setConfirmExitOpen(true);
      return;
    }
    closeAndReset();
  };

  const generateListButtonHandler = () => {
    setShowModal(true);
  };

  const onSaveHandler = () => {
    generateClicked ? saveRoutine() : createRoutine();
  };

  const createRoutine = async () => {
    const parsedMinutes = parseInt(minutes, 10);
    if (!parsedMinutes || parsedMinutes <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Enter a valid number of minutes."
      });
      return;
    }

    setGenerateClicked(true);
    setLoading(true);
    setErrorMessage("");

    const authToken = await getAuthToken()
    const login = await getLogin(authToken)

    fetch(`http://localhost:8080/create-routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        networkId,
        login: login,
        totalMinutes: String(parsedMinutes),
      }),
    })
      .then((response) => {
        if (response.status === 200) return response.json();
        if (response.status === 400) {
          setRoutine(null);
          setErrorMessage("No subset of actions fits in this time constraint");
          return null;
        }
        throw new Error("Unable to generate routine");
      })
      .then((data) => {
        if (data) setRoutine(data);
      })
      .catch(() => {
        setErrorMessage("An unexpected error occurred. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveRoutine = async () => {
    if (!routine) return;
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      // Map first (so achievedValues[idx] stays aligned with the original, unfiltered
      // routine.routineItems it was collected against), then drop anything without a
      // nodeId. Only items with their own quantifier - and an actual entered value -
      // get an achievedValue; everything else sends null so the backend can tell
      // "not applicable" apart from "the user entered 0".
      const routineItems = routine.routineItems
        .map((item, idx) => ({
          ...item,
          nodeId: item.nodeId,
          achievedValue: item.quantifierLabel && achievedValues[idx] !== undefined && achievedValues[idx] !== ''
            ? parseFloat(achievedValues[idx])
            : null
        }))
        .filter(item => item.nodeId !== null && item.nodeId !== undefined);
      const data = {
        login,
        networkId,
        totalMinutes: minutes,
        routineItems,
      };
      const res = await fetch('http://localhost:8080/save-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit routine');
      setShowModal(false);
      setGenerateClicked(false);
      setRoutine(null);
      setMinutes("");
      setAchievedValues([]); // Reset achieved values
      // Fired before the toast (and using a toast rather than a blocking alert at all) so a
      // badge-unlock notification triggered by this same submission isn't stuck waiting
      // behind a dismiss click - a native alert() pauses all page JS, including the
      // notification's own fetch/render, until it's closed.
      notifyBadgeCheck();
      toast({
        title: "Routine submitted",
        description: "Nice work - your progress has been saved."
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Failed to submit your routine. Please try again."
      });
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate List</DialogTitle>
          </DialogHeader>

          {generateClicked ? (
            routine ? (
              <RoutineList
                networkId={networkId}
                routine={routine}
                setGenererateListShowModal={setShowModal}
                handleEditNodeSave={handleEditNodeSave}
                onRoutineComplete={setAchievedValues} // Pass handler
              />
            ) : (
              <div className="text-red-600 font-bold">
                {errorMessage || "No routine available"}
              </div>
            )
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="minutes">Amount of Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Enter amount of minutes"
                  required
                />
              </div>

              {areaOfFocusNodes.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Areas of Focus</h4>
                  <ul className="list-disc list-inside">
                    {areaOfFocusNodes.map((node, index) => (
                      <li key={index}>{node.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              onClick={onSaveHandler}
              disabled={generateClicked && !routine}
            >
              {generateClicked ? (routine ? "Submit" : "In Progress") : "Generate"}
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit this routine session?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress on this routine hasn&apos;t been submitted yet and will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Going</AlertDialogCancel>
            <AlertDialogAction onClick={closeAndReset}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button onClick={generateListButtonHandler}>Generate List</Button>
    </div>
  );
}
