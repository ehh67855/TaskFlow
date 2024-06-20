import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import Sidebar from './SideBar';

const VisNetwork = ({
    nodes, 
    edges,
    addNode,
    deleteNode}) => {

    const networkRef = useRef(null);

    useEffect(() => {
        if (networkRef.current) {
            // Define the data for the network
            const data = {
                nodes,
                edges
            };

            // Create network options
            const options = {
                autoResize: false,
                //Use to determine user settings
                // configure : {
                //     enabled:true,
                //     showButton:true
                // },
                

                edges: {
                    smooth: {
                        type: 'dynamic'
                    },
                },
                layout: {
                    improvedLayout: true
                },
                physics: {
                    enabled: true,
                    solver: 'barnesHut'
                },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    addNode: function(nodeData,callback) {
                        addNode(nodeData,callback)
                    },
                    deleteNode: function(nodeData,callback) {
                        deleteNode(nodeData,callback)
                    }
                },
                interaction: {
                    keyboard:true,
                    navigationButtons: true,

                }
            };

            // Initialize network
            const network = new Network(networkRef.current, data, options);

            network.on("select", function (params) {
                console.log("select Event:", params);
              });

            // Clean up function to destroy network on component unmount
            return () => {
                if (network) {
                    network.destroy();
                }
            };
        }
    }, [nodes, edges]); // Rerun effect if nodes or edges change

    return (
        <div style={{ display: 'flex', height: '500px', width: '100%', border: '1px solid black', margin: '10px' }}>
            <div ref={networkRef} style={{ flexGrow: 1}} />
        </div>
    );

};

export default VisNetwork;
