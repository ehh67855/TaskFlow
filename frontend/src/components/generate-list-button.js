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
  DialogClose,
} from "@/components/ui/dialog";
import RoutineList from "@/components/routine-list";
import { getAuthToken, getLogin } from "@/services/BackendService";

export default function GenerateListButton({ networkId, networkQuantifier, areaOfFocusNodes = [], handleEditNodeSave }) {
  const [showModal, setShowModal] = useState(false);
  const [generateClicked, setGenerateClicked] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [achievedValues, setAchievedValues] = useState([]); // New state

  const handleClose = () => {
    if (generateClicked && confirm("Are you sure you would like to exit this routine session")) {
      setShowModal(false);
    } else {
      setShowModal(false);
    }
    setGenerateClicked(false);
    setErrorMessage("");
  };

  const generateListButtonHandler = () => {
    setShowModal(true);
  };

  const onSaveHandler = () => {
    generateClicked ? saveRoutine() : createRoutine();
  };

  const createRoutine = async () => {
    if (minutes <= 0) {
      alert("Enter valid number of minutes");
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
        totalMinutes: minutes,
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
      // Ensure nodeId is included and not null/undefined
      const routineItems = routine.routineItems
        .filter(item => item.nodeId !== null && item.nodeId !== undefined)
        .map((item, idx) => ({
          ...item,
          nodeId: item.nodeId, // explicitly include nodeId
          achievedValue: achievedValues[idx] !== undefined ? parseFloat(achievedValues[idx]) || 0 : 0 // set achievedValue
        }));
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
      setMinutes(0);
      setAchievedValues([]); // Reset achieved values
      alert('Routine submitted successfully!');
    } catch (err) {
      alert('Failed to submit routine data.');
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate List</DialogTitle>
          </DialogHeader>

          {generateClicked ? (
            routine ? (
              <RoutineList
                networkId={networkId}
                networkQuantifier={networkQuantifier}
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
                  onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
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
            <DialogClose asChild>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button onClick={generateListButtonHandler}>Generate List</Button>
    </div>
  );
}
