import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';

const MiniNetwork = ({ nodes, edges }) => {
    const networkContainerRef = useRef(null);

    useEffect(() => {
        if (networkContainerRef.current && nodes && edges) {
            const data = { 
                nodes, 
                edges: edges.map(edge => ({
                    id: edge.id,
                    to: edge.to.id,
                    from: edge.from.id
                }))
            };
            
            const options = {
                autoResize: true,
                height: '100px',
                width: '100%',
                interaction: {
                    dragNodes: false,
                    zoomView: false,
                    dragView: false
                },
                physics: {
                    enabled: false // Disabling physics to keep nodes in a readable layout
                }
            };
            
            const network = new Network(networkContainerRef.current, data, options);

            return () => {
                network.destroy();
            };
        }
    }, [nodes, edges]);

    return <div ref={networkContainerRef} style={{ height: '100px', width: '100%' }} />;
};

export default MiniNetwork;
