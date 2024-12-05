import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import CustomModal from "src/customModal/CustomModal";
import { getAuthToken, getLogin } from "src/services/BackendService";
import RoutineList from "./RoutineList";

export default function GenerateListButton({ networkId, areaOfFocusNodes = [] , handleEditNodeSave}) {
  const [showModal, setShowModal] = useState(false);
  const [generateClicked, setGenerateClicked] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleClose = () => {
    if (generateClicked && confirm("Are you sure you would like to exit this routine session")) {
      setShowModal(false);
    } else {
      setShowModal(false);
    }
    setGenerateClicked(false);
    setErrorMessage(""); // Clear error message on close
  };

  const generateListButtonHandler = () => {
    setShowModal(true);
  };

  const onSaveHandler = () => {
    generateClicked ? saveRoutine() : createRoutine();
  };

  const createRoutine = () => {
    if (minutes <= 0) {
      alert("Enter valid number of minutes");
      return;
    }

    setGenerateClicked(true);
    setLoading(true);
    setErrorMessage(""); // Clear any previous error messages

    console.log({
      networkId: networkId,
      login: getLogin(getAuthToken()),
      minutes: minutes,
    });

    fetch(`http://localhost:8080/create-routine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        networkId: networkId,
        login: getLogin(getAuthToken()),
        totalMinutes: minutes,
      }),
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else if (response.status === 400) {
          setRoutine(null);
          setErrorMessage("No subset of actions fits in this time constraint"); // Set error message
          return null;
        } else {
          throw new Error("Unable to generate routine");
        }
      })
      .then((data) => {
        console.log(data);
        if (data) {
          setRoutine(data);
        }
      })
      .catch((error) => {
        console.log(error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveRoutine = () => {
    // Implement save routine logic here
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <CustomModal
        show={showModal}
        handleClose={handleClose}
        title={"Generate List"}
        saveText={generateClicked ? "In Progress" : "Generate"}
        onSave={onSaveHandler}
      >
        {generateClicked ? (
          routine ? (
            <RoutineList 
              networkId={networkId} 
              routine={routine}
              setGenererateListShowModal={setShowModal}
              handleEditNodeSave={handleEditNodeSave}
            ></RoutineList>
          ) : (
            <div style={{ color: "red", fontWeight: "bold" }}>
              {errorMessage || "No routine available"}
            </div>
          )
        ) : (
          <>
            <Form>
              <Form.Group controlId="formMinutes">
                <Form.Label>Amount of Minutes</Form.Label>
                <Form.Control
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                  placeholder="Enter amount of minutes"
                  required
                />
              </Form.Group>
            </Form>
            <br></br>
            {areaOfFocusNodes.length > 0 && (
              <>
                <h4>Areas of Focus</h4>
                <ul>
                  {areaOfFocusNodes.map((node, index) => (
                    <li key={index}>{node.title}</li>
                  ))}
                </ul>
              </>
            )}

          </>
        )}
      </CustomModal>
      <Button onClick={generateListButtonHandler}>Generate List</Button>
    </div>
  );
}
