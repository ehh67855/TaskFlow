const nodes = JSON.parse(nodesData);
const edges = JSON.parse(edgesData);
const container = document.getElementById("networkContainer");
const data = {
nodes: new vis.DataSet(nodes),
edges: new vis.DataSet(edges),
};

console.log(data);

const options = {
edges: {
    arrows: {
    to: { enabled: true }, // Enable arrows pointing to the target node
    },
},
manipulation: {
    enabled: true,
    initiallyActive: true,
    addNode: function (nodeData, callback) {
    delete nodeData.id;
    // Make a POST request to store the node data in the backend
    fetch("/network/api/nodes", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        // Add any other required headers here, such as authorization tokens
        },
        body: JSON.stringify(nodeData),
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
        })
        .then((createdNode) => {
        console.log("Created node:", createdNode);
        callback(createdNode);
        })
        .catch((error) => {
        // Handle errors, such as network issues or server errors
        console.error("Error creating node:", error);

        // Call the callback function with an eorror if needed
        // For example, if there was an error creating the node on the backend,
        // you might want to inform the user about the failure
        callback(null, error);
        });
    },
    addEdge: function (edgeData, callback) {
    console.log(edges);
    const toNode = network.body.data.nodes.get(edgeData.to);
    const fromNode = network.body.data.nodes.get(edgeData.from);

    // Make a POST request to store the node data in the backend
    fetch("/network/api/edges", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        // Add any other required headers here, such as authorization tokens
        },

        body: JSON.stringify(edgeData),
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
        })
        .then((createdEdge) => {
        // The newly created node returned from the backend (optional)
        console.log("Created edge:", createdEdge);
        // You can update your frontend data with the createdNode if needed

        // Call the callback function with the created node data
        callback(createdEdge);
        })
        .catch((error) => {
        // Handle errors, such as network issues or server errors
        console.error("Error creating edge:", error);

        // Call the callback function with an error if needed
        // For example, if there was an error creating the node on the backend,
        // you might want to inform the user about the failure
        callback(null, error);
        });
    },
    editEdge: function (edgeData, callback) {
    console.log(edgeData);
    fetch(`/network/api/edges/${edgeData.id}/${edgeData.from}/${edgeData.to}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            // Add any other required headers here, such as authorization tokens
        }
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        callback(edgeData)
    })
    .catch((error) => {
        console.error("Error updating edge:", error);
    });
    },
    deleteNode: function (nodeIds, callback) {
    if (nodeIds.nodes[0] == 1) {
        document.getElementById("toast-text").innerHTML =
        "Cannot delete root node";
        showToast();
        callback(null);
        return;
    }
    // Make a DELETE request to delete the node from the backend
    fetch(`/network/api/nodes/${nodeIds.nodes[0]}`, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        // Add any other required headers here, such as authorization tokens
        },
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        // If the deletion was successful, you may return a success message if desired
        return response.json();
        })
        .then((deletedNode) => {
        // The deleted node returned from the backend (optional)
        console.log("Deleted node:", deletedNode);
        callback(nodeIds);
        })
        .catch((error) => {
        // Handle errors, such as network issues or server errors
        console.error("Error deleting node:", error);

        // Call the callback function with an error if needed
        // For example, if there was an error deleting the node on the backend,
        // you might want to inform the user about the failure
        callback(null, error);
        });
    },
    deleteEdge: function (edgeIds, callback) {
    if (edgeIds) console.log(edgeIds);
    // Make a DELETE request to delete the edge from the backend
    fetch(`/network/api/edges/${edgeIds.edges[0]}`, {
        // Assuming edgeIds is an object containing the IDs of the edges to delete
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        // Add any other required headers here, such as authorization tokens
        },
    })
        .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        // If the deletion was successful, you may return a success message if desired
        return response.json();
        })
        .then((deletedEdge) => {
        // The deleted edge returned from the backend (optional)
        console.log("Deleted edge:", deletedEdge);
        callback(edgeIds);
        })
        .catch((error) => {
        // Handle errors, such as network issues or server errors
        console.error("Error deleting edge:", error);

        // Call the callback function with an error if needed
        // For example, if there was an error deleting the edge on the backend,
        // you might want to inform the user about the failure
        callback(null, error);
        });
    },
},
};
const network = new vis.Network(container, data, options);
