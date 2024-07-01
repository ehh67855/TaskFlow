// NetworkPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VisNetwork from './VisNetwork';
import MessageToast from 'src/MessageToast/MessageToast';
import NetworkEditor from './NetworkEditor';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Sidebar from './SideBar';
import { getAuthToken, setAuthHeader } from 'src/services/BackendService';
import Draggable from 'react-draggable';
import { Card, Spinner } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';

export default function NetworkPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorShow, setErrorShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [networkName, setNetworkName] = useState("");
  const [networkQuantifier, setNetworkQuantifier] = useState("");

  var selectedNode = {};

  useEffect(() => {
    console.log('Network Rerender');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
  }, [nodes, edges]);

  useEffect(() => {
    // if (!getAuthToken()) {
    //   window.location.href = '/login';
    // }
    fetch(`http://localhost:8080/get-network/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 401) {
          setAuthHeader(null);
          window.location.href = "/session-timeout"
          throw new Error('Token Expired');
        }
      })
      .then((data) => {
        console.log(data)
        setNetworkName(data.name);
        setNetworkQuantifier(data.quantifier);
        setNodes(data.nodes);
        setEdges(
          data.edges.map((edge) => ({
            id: edge.id,
            to: edge.to.id,
            from: edge.from.id,
          }))
        );
      })
      .catch((error) => {
        console.log('get-network error', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const addNode = (nodeData, callback) => {
    fetch(`http://localhost:8080/create-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...nodeData,
        networkId: id,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        // setNodes(prevNodes => [...prevNodes, data]);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback) {
            callback({
              ...nodeData,
            color:"#7FC6A4"
          });
        }
      });
  };

  const deleteNode = (nodeData, callback) => {
    fetch(`http://localhost:8080/delete-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: nodeData.nodes[0],
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        // setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeData.id));
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback)
          callback(nodeData);
      });
  };

  const editNode = (edgeData, callback) => {
    fetch(`http://localhost:8080/edit-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...edgeData,
        networkId: id,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        console.log('edit node', data);
        // setEdges
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback)
          callback(edgeData);
      });
  };

  const addEdge = (edgeData, callback) => {
    fetch(`http://localhost:8080/create-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...edgeData,
        networkId: id,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        let newEdge = {
          id: data.id,
          to: data.to.id,
          from: data.from.id,
        };
        // setEdges(prevEdges => [...prevEdges, newEdge]);
        console.log('Edge data', data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback)
          callback(edgeData);
      });
  };

  const deleteEdge = (edgeData, callback) => {
    fetch(`http://localhost:8080/delete-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: edgeData.edges[0],
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        // setEdges(prevNodes => prevNodes.filter(edge => edge.id !== edgeData.id));
        console.log('Edge data', data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback)
          callback(edgeData);
      });
  };

  const editEdge = (edgeData, callback) => {
    fetch(`http://localhost:8080/edit-edge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...edgeData,
        networkId: id,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        console.log('edit data', data);
        // setEdges
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if(callback)
          callback(edgeData);
      });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <ClipLoader color="#3498db" loading={loading} size={150} />
</div>;
  }

  return (
    <Container fluid style={{ height: '100vh' }}>
      <MessageToast
        show={errorShow}
        title={'Error logging in'}
        message={errorMessage}
        onClose={() => setErrorShow(false)}
        bg={'danger'}
      />
      <Row>
        <Col xs={1}>
          <Sidebar />
        </Col>
        <Col>
          <VisNetwork
            networkId={id}
            networkName={networkName}
            networkQuantifier={networkQuantifier}
            nodes={nodes}
            edges={edges}
            addNode={addNode}
            deleteNode={deleteNode}
            addEdge={addEdge}
            deleteEdge={deleteEdge}
            editEdge={editEdge}
            editNode={editNode}
          />
        </Col>
      </Row>
    </Container>
    
  );
}
