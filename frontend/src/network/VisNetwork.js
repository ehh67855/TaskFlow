import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import Sidebar from './SideBar';

const VisNetwork = ({ nodes, edges }) => {
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
                clickToUse:true,

                //Use to determine user settings
                // configure : {
                //     enabled:true,
                //     showButton:true
                // },

                edges: {
                    smooth: {
                        type: 'dynamic'
                    }
                },
                layout: {
                    improvedLayout: true
                },
                physics: {
                    enabled: true,
                    barnesHut: {
                        gravitationalConstant: -3000,
                        centralGravity: 0.3,
                        springLength: 95,
                        springConstant: 0.04,
                        damping: 0.09,
                        avoidOverlap: 0.1
                    },
                    solver: 'barnesHut'
                },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    addNode: function(nodeData,callback) {
                        console.log(nodeData);
                        callback(nodeData);
                    }
                },
                interaction: {
                    keyboard:true,
                    navigationButtons: true,

                }
            };

            // Initialize network
            const network = new Network(networkRef.current, data, options);

            // Clean up function to destroy network on component unmount
            return () => {
                if (network) {
                    network.destroy();
                }
            };
        }
    }, [nodes, edges]); // Rerun effect if nodes or edges change

    return (
        <div style={{ display: 'flex', height: '500px', width: '100%' }}>
            <Sidebar />
            <div ref={networkRef} style={{ flexGrow: 1, marginBottom: '50px' }} />
        </div>
    );

};

export default VisNetwork;
