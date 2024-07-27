// GenerateListButton.js
import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import CustomModal from "src/customModal/CustomModal";
import { getAuthToken, getLogin } from "src/services/BackendService";
import RoutineList from "./RoutineList";

export default function GenerateListButton({ networkId, areaOfFocusNodes = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [generateClicked, setGenerateClicked] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [routine, setRoutine] = useState({});
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (generateClicked && confirm("Are you sure you would like to exit this routine session")) {
      setShowModal(false);
    } else {
      setShowModal(false);
    }
    setGenerateClicked(false);
  };

  const generateListButtonHandler = () => {
    setShowModal(true);
  };

  const onSaveHandler = () => {
    generateClicked ? saveRoutine() : createRoutine();
  };

  const createRoutine = () => {
    setLoading(true);
    setGenerateClicked(true);

    fetch(`http://localhost:8080/create-routine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        networkId: networkId,
        login: getLogin(getAuthToken()),
        minutes: minutes,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setRoutine(data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveRoutine = () => {
    // Implement save routine logic here
  };

  useEffect(() => console.log(areaOfFocusNodes), [areaOfFocusNodes]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <CustomModal
        show={showModal}
        handleClose={handleClose}
        title={"Generate List"}
        saveText={generateClicked ? "Complete" : "Generate"}
        onSave={onSaveHandler}
      >
        {generateClicked ? (
          routine && <RoutineList networkId={networkId} routine={routine}></RoutineList>
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
            <h4>Areas of Focus</h4>
            <ul>
              {areaOfFocusNodes.map((node, index) => (
                <li key={index}>{node.title}</li>
              ))}
            </ul>
          </>
        )}
      </CustomModal>
      <Button onClick={generateListButtonHandler}>Generate List</Button>
    </div>
  );
}
