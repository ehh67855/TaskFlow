// NetworkPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import VisNetwork from './VisNetwork';
import MessageToast from 'src/MessageToast/MessageToast';
import NetworkEditor from './NetworkEditor';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Sidebar from './SideBar';
import { getAuthToken, getLogin, setAuthHeader } from 'src/services/BackendService';
import { ClipLoader } from 'react-spinners';
import NotFound from 'src/notFound/NotFound';

export default function NetworkPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorShow, setErrorShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [networkName, setNetworkName] = useState("");
  const [networkQuantifier, setNetworkQuantifier] = useState("");

  // Ref to store the cache of edges
  const edgesCache = useRef([]);

  const pushNode = (node) => {
    nodes.push(node)
  }

  useEffect(() => {
    console.log('Network Rerender');
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
  }, [nodes, edges]);

  useEffect(() => {
    fetch(`http://localhost:8080/get-network/${id}?login=${getLogin(getAuthToken())}`, {
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
        } else if (response.status === 404) {
          window.location.href = "/"
          throw new Error('Forbidden access or doesnt exist');

        }
      })
      .then((data) => {
        console.log(data);
        setNetworkName(data.name);
        setNetworkQuantifier(data.quantifier);
        setNodes(data.nodes.map(node => {
          if (node.label === "Root Node") {
            return node;
          }
          if (node.title === "Inactive") {
            return {
              ...node,
              title: "Edit node to activate",
              label: node.title
            };
          }
          return {
            ...node,
            label: node.title.length > 15 ? node.title.substring(0, 15) + "..." : node.title
          };
        }));


        
        
        const edgesData = data.edges.map((edge) => ({
          id: edge.id,
          to: edge.to.id,
          from: edge.from.id,
        }));
        setEdges(edgesData);
        // Initialize the edges cache
        edgesCache.current = edgesData;
      })
      .catch((error) => {
        console.log('get-network error', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const downloadGraph = () => {
    const data = {
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = networkName + '_graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };


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
        const newNode = {
          ...nodeData,
          id: data.id,
          color: "#7FC6A4",
          label: "Inactive",
          title: "Edit node to activate"
        }
        if (callback) {
          callback(newNode);
        }
        nodes.push(newNode);
      })
      .catch((error) => {
        console.log(error);
      });
  };



  const deleteNode = (nodeData, callback, setSelectedNode) => {
    console.log(nodeData);

    let node = nodes.find(x => x.id === nodeData.nodes[0]);
    console.log(node);

    if (node.color && node.color === "#808080") {
      setErrorMessage("Cannot delete the root node");
      setErrorShow(true);
      callback(null);
      return;
    }

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
          return response;
        }
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (callback)
          callback(nodeData);
        setSelectedNode(null);
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
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (callback)
          callback(edgeData);
      });
  };

  const addEdge = (edgeData, callback) => {
    if (edgeData.to === edgeData.from) {
      callback(null);
      return;
    }

    const edgeExists = edgesCache.current.find(x => (x.from === edgeData.from && x.to === edgeData.to) || (x.from === edgeData.to && x.to === edgeData.from));

    if (edgeExists) {
      setErrorMessage("Edge already exists");
      setErrorShow(true);
      callback(null);
      return;
    }

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

        // Update the local cache
        edgesCache.current = [...edgesCache.current, newEdge];

        if (callback)
          callback(newEdge);

        console.log('Edge data', data);
      })
      .catch((error) => {
        console.log(error);
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
    .then(response => {
      edgesCache.current = edgesCache.current.filter(edge => edge.id !== edgeData.edges[0]);
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      if (callback)
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
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (callback)
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
        title={'Oops!'}
        message={errorMessage}
        onClose={() => setErrorShow(false)}
        bg={'danger'}
      />
      <Row>
        <Col xs={1}>
          <Sidebar downloadGraph={downloadGraph}/>
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
            pushNode={pushNode}
          />
        </Col>
      </Row>
    </Container>
  );
}
