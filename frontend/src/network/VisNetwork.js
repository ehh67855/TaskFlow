import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';

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
                autoResize: true,
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
                }
            };

            confirm("ballsack")

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

    return <div ref={networkRef} style={{ marginBottom: '50px', height: '500px', width: '100%' }} />;
};

export default VisNetwork;
