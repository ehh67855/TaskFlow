package com.sergio.jwt.backend.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.sergio.jwt.backend.dtos.AddChildRequest;
import com.sergio.jwt.backend.dtos.EdgeDto;
import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.dtos.NodeDto;
import com.sergio.jwt.backend.entites.Edge;
import com.sergio.jwt.backend.entites.Node;
import com.sergio.jwt.backend.entites.User;
import com.sergio.jwt.backend.exceptions.AppException;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.repositories.EdgeRepository;
import com.sergio.jwt.backend.repositories.NetworkRepository;
import com.sergio.jwt.backend.repositories.NodeRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;



@RequiredArgsConstructor
@Service
public class NetworkService {

    private final NetworkRepository networkRepository;

    private final UserService userService;

    private final NodeRepository nodeRepository;

    private final EdgeRepository edgeRepository;

    public List<Network> getUserNetworksByLogin(String login) {
        return userService.getUser(login).getNetworks();
    }

    public Network getNetwork(Long id) {
        return networkRepository.findById(id).orElseThrow(
            ()-> new AppException("Network not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public Network createNetwork(NetworkDto networkDto) {
        // Check if network name is already in use
        if (networkRepository.findByName(networkDto.name()).isPresent()) {
            throw new AppException("Network name is already in use", HttpStatus.CONFLICT);
        }

        // Create new Network instance
        Network network = Network.builder()
                                 .name(networkDto.name())
                                 .nodes(new ArrayList<>()) // Initialize nodes list
                                 .build();

        // Create hardcoded initial node
        Node initialNode = Node.builder()
                               .label("Root Node")
                               .title("This is your root node! Everything stems from here.")
                               .color("#808080")
                               .network(network) // Set this node's network
                               .build();

        // Add initial node to network
        network.getNodes().add(initialNode);

        // Assign user to the network
        User user = userService.getUser(networkDto.login());
        network.setUser(user);

        // Add new network to user's list of networks and update user
        List<Network> userNetworks = user.getNetworks();
        userNetworks.add(network);
        user.setNetworks(userNetworks);

        // Save and return the new network
        return networkRepository.save(network);
    }


    public void deleteNetwork(Long id) {
        networkRepository.deleteById(id);
    }

    public Node createNode(NodeDto node) {
        Network newNetwork = networkRepository.findById(Long.valueOf(node.networkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));
    
        Node newNode = Node.builder()
            .color("#7FC6A4")
            .title("Add description")
            .label("New")
            .network(newNetwork) // Make sure the relationship is set
            .build();
    
        Node savedNode = nodeRepository.save(newNode); // Save the new node first
    
        List<Node> nodes = newNetwork.getNodes();
        nodes.add(savedNode);
        newNetwork.setNodes(nodes);
    
        networkRepository.save(newNetwork); // Save the updated network
    
        return savedNode;
    }
    
    
    @Transactional
    public void deleteNode(Long nodeId) {
        // Fetch the node (optional, only if you want to throw an exception if it doesn't exist)
        nodeRepository.findById(nodeId).orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));

        // Delete all edges where the node is either 'from' or 'to'
        edgeRepository.deleteByFromId(nodeId);
        edgeRepository.deleteByToId(nodeId);

        // Now delete the node
        nodeRepository.deleteById(nodeId);
    }

    public Edge createEdge(EdgeDto edge) {
        Network newNetwork = networkRepository.findById(Long.valueOf(edge.networkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node toNode = nodeRepository.findById(Long.valueOf(edge.to()))
            .orElseThrow(() -> new AppException("Node Not Found", HttpStatus.NOT_FOUND));

        Node fromNode = nodeRepository.findById(Long.valueOf(edge.from()))
            .orElseThrow(() -> new AppException("Edge Not Found", HttpStatus.NOT_FOUND));

        Edge newEdge = Edge.builder()
            .to(toNode)
            .from(fromNode)
            .network(newNetwork)
            .build();

        Edge savedEdge = edgeRepository.save(newEdge);

        List<Edge> edges = newNetwork.getEdges();
        edges.add(savedEdge);
        newNetwork.setEdges(edges);

        networkRepository.save(newNetwork);

        return savedEdge;
    }

    public void deleteEdge(EdgeDto edge) {
        edgeRepository.deleteById(Long.valueOf(edge.id()));
    }

    
    public Edge editEdge(EdgeDto edge) {
        Network newNetwork = networkRepository.findById(Long.valueOf(edge.networkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node toNode = nodeRepository.findById(Long.valueOf(edge.to()))
            .orElseThrow(() -> new AppException("Node Not Found", HttpStatus.NOT_FOUND));

        Node fromNode = nodeRepository.findById(Long.valueOf(edge.from()))
            .orElseThrow(() -> new AppException("Edge Not Found", HttpStatus.NOT_FOUND));

        Edge newEdge = Edge.builder()
            .id(Long.valueOf(edge.id()))
            .to(toNode)
            .from(fromNode)
            .network(newNetwork)
            .build();

        Edge savedEdge = edgeRepository.save(newEdge);

        List<Edge> edges = newNetwork.getEdges();
        for (int i = 0  ; i < edges.size() ; i++) {
            if (edges.get(i).getId() == Long.valueOf(edge.id())) {
                edges.set(i, savedEdge);
            }
        }
        newNetwork.setEdges(edges);
        networkRepository.save(newNetwork);

        return savedEdge;
    }

    @Transactional
    public Node editNode(NodeDto nodeDto) {
        Network newNetwork = networkRepository.findById(Long.valueOf(nodeDto.networkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node node = nodeRepository.findById(Long.parseLong(nodeDto.id()))
                .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));

        node.setTitle(nodeDto.title());
        node.setLabel(nodeDto.label());
        node.setColor(nodeDto.color());
        
        Node savedNode = nodeRepository.save(node);

        List<Node> nodes = newNetwork.getNodes();
        for (int i = 0 ; i < nodes.size() ; i++) {
            if (nodes.get(i).getId() == Long.valueOf(nodeDto.id())) {
                nodes.set(i,savedNode);
            }
        }
        newNetwork.setNodes(nodes);
        networkRepository.save(newNetwork);

        return savedNode;
    }

    public Edge addChild(AddChildRequest addChildRequest) {
        NodeDto node = addChildRequest.getNode();
        EdgeDto edge = addChildRequest.getEdge();
        Node savedNode = createNode(node);
        EdgeDto newEdge = EdgeDto.builder()
            .to(String.valueOf(String.valueOf(savedNode.getId())))
            .from(edge.from())
            .networkId(edge.networkId())
            .build();
        return createEdge(newEdge);

    }

    
}
