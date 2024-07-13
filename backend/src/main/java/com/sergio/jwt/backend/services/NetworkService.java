package com.sergio.jwt.backend.services;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
import com.sergio.jwt.backend.dtos.RoutineDto;
import com.sergio.jwt.backend.dtos.UpdateNodeRequest;
import com.sergio.jwt.backend.entites.Edge;
import com.sergio.jwt.backend.entites.Node;
import com.sergio.jwt.backend.entites.Routine;
import com.sergio.jwt.backend.entites.RoutineItem;
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

    private final RoutineService routineService;

    public List<Network> getUserNetworksByLogin(String login) {
        return userService.getUser(login).getNetworks();
    }

    public Network getNetwork(Long id) {
        return networkRepository.findById(id).orElseThrow(
            ()-> new AppException("Network not found", HttpStatus.NOT_FOUND));
    }


    @Transactional
    public Network createNetwork(NetworkDto networkDto) {
        System.out.println(networkDto);
    
        // Check if network name is already in use
        if (networkRepository.findByName(networkDto.name()).isPresent()) {
            throw new AppException("Network name is already in use", HttpStatus.CONFLICT);
        }
    
        // Create new Network instance
        Network network = Network.builder()
                                 .name(networkDto.name())
                                 .quantifier(networkDto.quantifier())
                                 .nodes(new ArrayList<>()) // Initialize nodes list
                                 .edges(new ArrayList<>()) // Initialize edges list
                                 .build();
    
        if (networkDto.nodes().size() == 0 && networkDto.edges().size() == 0) {
            Node initialNode = Node.builder()
                                    .label("Root Node")
                                    .title("Root Node")
                                    .color("#808080")
                                    .network(network) // Set this node's network
                                    .build();
            network.getNodes().add(initialNode);
        }
    
        // Assign user to the network
        User user = userService.getUser(networkDto.login());
        network.setUser(user);
    
        // Add new network to user's list of networks and update user
        List<Network> userNetworks = user.getNetworks();
        userNetworks.add(network);
        user.setNetworks(userNetworks);
    
        // Save the network first to get the network ID
        Network savedNetwork = networkRepository.save(network);
    
        // Handle nodes
        Map<Long, Node> idNodeMap = new HashMap<>();
        if (networkDto.nodes() != null) {
            for (NodeDto nodeDto : networkDto.nodes()) {
                Node node = Node.builder()
                                .label(nodeDto.label())
                                .title(nodeDto.title())
                                .color(nodeDto.color())
                                .network(savedNetwork) // Set this node's network
                                .build();
                Node savedNode = nodeRepository.save(node);
                savedNetwork.getNodes().add(savedNode);
                idNodeMap.put(Long.valueOf(nodeDto.id()), savedNode); // Convert String to Long
                System.out.println("Saved node: " + savedNode.getId()); // Debug log
            }
        }
    
        // Save the network again to ensure nodes are persisted
        savedNetwork = networkRepository.save(savedNetwork);
    
        // Handle edges
        if (networkDto.edges() != null) {
            for (EdgeDto edgeDto : networkDto.edges()) {
                System.out.println("Processing edge: from " + edgeDto.from() + " to " + edgeDto.to()); // Debug log
    
                Node fromNode = idNodeMap.get(Long.valueOf(edgeDto.from())); // Convert String to Long
                Node toNode = idNodeMap.get(Long.valueOf(edgeDto.to())); // Convert String to Long
    
                if (fromNode == null || toNode == null) {
                    throw new AppException("Node Not Found: " + (fromNode == null ? edgeDto.from() : edgeDto.to()), HttpStatus.NOT_FOUND);
                }
    
                Edge edge = Edge.builder()
                                .from(fromNode)
                                .to(toNode)
                                .network(savedNetwork) // Set this edge's network
                                .build();
                Edge savedEdge = edgeRepository.save(edge);
                savedNetwork.getEdges().add(savedEdge);
                System.out.println("Saved edge: " + savedEdge.getId()); // Debug log
            }
        }
    
        // Save and return the updated network
        return networkRepository.save(savedNetwork);
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

    public Node updateNode(UpdateNodeRequest updateNodeRequest) {

        System.out.println(updateNodeRequest);

        Network newNetwork = networkRepository.findById(Long.valueOf(updateNodeRequest.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node node = nodeRepository.findById(Long.parseLong(updateNodeRequest.getId()))
                .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));

        node.setTitle(updateNodeRequest.getTitle());
        node.setPriority(Integer.valueOf(updateNodeRequest.getPriority()));
        node.setDifficulty(Integer.valueOf(updateNodeRequest.getDifficulty()));
        node.setAreaOfFocus(updateNodeRequest.getIsAreaOfFocus().equals("true"));
        node.setDescription(updateNodeRequest.getDescription());
            
        try {
            long seconds = Long.parseLong(updateNodeRequest.getEstimatedTime());
            node.setEstimatedAmountOfTime(Duration.ofSeconds(seconds));
        } catch (NumberFormatException e) {
            System.err.println("Invalid number format: " + updateNodeRequest.getEstimatedTime());
            node.setEstimatedAmountOfTime(Duration.ZERO); // or throw an exception, or handle it according to your needs
        }

        Node savedNode = nodeRepository.save(node);

        List<Node> nodes = newNetwork.getNodes();
        for (int i = 0 ; i < nodes.size() ; i++) {
            if (nodes.get(i).getId() == savedNode.getId()) {
                nodes.set(i, savedNode);
            }
        }

        networkRepository.save(newNetwork);

        return savedNode;
    }

    public Routine createRoutine(RoutineDto routine) {
        Routine newRoutine = new Routine();

        User user = userService.getUser(routine.getLogin());
        Network network = getNetwork(Long.valueOf(routine.getNetworkId()));
        
        List<RoutineItem> routineItems = new ArrayList<>();
        for (Node node : network.getNodes()) {
            routineItems.add(RoutineItem.builder()
                .amountOfTime(Duration.ofMinutes(1))
                .node(node)
                .targetValue(0)
                .achievedValue(0)
                .build()
            );
        }
        newRoutine.setRoutineItems(routineItems);
        newRoutine.setUser(user);

        System.out.println(routine);

        return newRoutine;
    }
   


    
}
