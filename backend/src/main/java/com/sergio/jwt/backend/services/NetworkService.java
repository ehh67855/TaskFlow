package com.sergio.jwt.backend.services;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.RequestMappingInfoHandlerMethodMappingNamingStrategy;

import com.sergio.jwt.backend.dtos.AddChildRequest;
import com.sergio.jwt.backend.dtos.EdgeDto;
import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.dtos.NodeDto;
import com.sergio.jwt.backend.dtos.RoutineDto;
import com.sergio.jwt.backend.dtos.RoutineItemDto;
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
import com.sergio.jwt.backend.repositories.RoutineRepository;
import com.sergio.jwt.backend.services.optimizer.GeneticAlgorithm;
import com.sergio.jwt.backend.services.optimizer.RoutineOptimizer;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;




@RequiredArgsConstructor
@Service
public class NetworkService {

    private final NetworkRepository networkRepository;

    private final UserService userService;

    private final NodeRepository nodeRepository;

    private final EdgeRepository edgeRepository;

    private final RoutineRepository routineRepository;

    public List<Network> getUserNetworksByLogin(String login) {
        User user = userService.getUser(login);
        return user.getNetworks().stream().map(this::mapNetwork).collect(Collectors.toList());
    }

    private Network mapNetwork(Network network) {
        Network result = new Network();
        result.setId(network.getId());
        result.setName(network.getName());
        result.setQuantifier(network.getQuantifier());
        result.setNodes(network.getNodes()); // Populate nodes
        result.setEdges(network.getEdges().stream().map(edge -> {
            Edge resultEdge = new Edge();
            resultEdge.setId(edge.getId());
            resultEdge.setFrom(edge.getFrom());
            resultEdge.setTo(edge.getTo());
            return resultEdge;
        }).collect(Collectors.toList())); // Populate edges with details
        return result;
    }
    

    public Network getNetwork(Long id, String login) {
        return networkRepository.findByIdAndUserLogin(id, login).orElseThrow(
            ()-> new AppException("Network not found", HttpStatus.NOT_FOUND));
    }


    @Transactional
    public Network createNetwork(NetworkDto networkDto) {
        User user = userService.getUser(networkDto.login());

        // Check if the network name is already in use by the specific user
        if (networkRepository.findByNameAndUser(networkDto.name(), user).isPresent()) {
            throw new AppException("Network name is already in use by this user", HttpStatus.CONFLICT);
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
            .title("Inactive")
            .label("Inactive")
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

        Network newNetwork = networkRepository.findById(Long.valueOf(updateNodeRequest.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node node = nodeRepository.findById(Long.parseLong(updateNodeRequest.getId()))
                .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));


        node.setTitle(updateNodeRequest.getTitle());
        node.setPriority(Integer.valueOf(updateNodeRequest.getPriority()));
        node.setDifficulty(Integer.valueOf(updateNodeRequest.getDifficulty()));
        node.setAreaOfFocus(updateNodeRequest.getIsAreaOfFocus().equals("true"));
        node.setDescription(updateNodeRequest.getDescription());
            
        int minutes = Integer.parseInt(updateNodeRequest.getEstimatedMinutes());
        int seconds = Integer.parseInt(updateNodeRequest.getEstimatedSeconds());
        Duration duration = Duration.ofMinutes(minutes).plusSeconds(seconds);
        node.setEstimatedAmountOfTime(duration);


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
        Network network = networkRepository.findById(Long.valueOf(routine.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));
        User user = userService.getUser(routine.getLogin());

        RoutineOptimizer routineOptimizer = new RoutineOptimizer(network);
        routineOptimizer.printNodeScores();
        List<Node> selectedNodes = routineOptimizer.optimize(Duration.ofMinutes(Long.valueOf(routine.getTotalMinutes())));
        
        Routine newRoutine = Routine.builder().user(user).build();
        Routine savedRoutine = routineRepository.save(newRoutine);

        List<RoutineItem> routineItems = new ArrayList<>();
        for (Node node : selectedNodes) {
            routineItems.add(
                RoutineItem.builder()

                .amountOfTime(node.getEstimatedAmountOfTime().toMillis())
                .routine(savedRoutine)
                .build()
            );
        }

        savedRoutine.setRoutineItems(routineItems);
        
        return routineRepository.save(savedRoutine);
    }


    public Routine getDummyRoutine(RoutineDto routineDto) {

        Network network = networkRepository.findById(Long.valueOf(routineDto.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));
        
        for (Node node : network.getNodes()) {
            System.out.println("------------");
            System.out.println(node);
            System.out.println();
        }

        System.out.println(routineDto);

        Routine routine = new Routine();     
        routine.setId(0L);
        
        List<RoutineItem> routineItems = new ArrayList<>();

        List<Node> nodes = network.getNodes();

        for (Node node : nodes) {
            if (node.getEstimatedAmountOfTime() != null && !node.getTitle().equals("Inactive") && node.getEstimatedAmountOfTime().toMillis() != 0) {
                RoutineItem item = new RoutineItem();
                item.setAmountOfTime(node.getEstimatedAmountOfTime().toMillis());
                item.setItemName(node.getTitle());
                item.setNodeId(node.getId());
                item.setRoutine(routine);
                routineItems.add(item);
            }  
        }
        routine.setRoutineItems(routineItems);

        return routine;
    }

    public RoutineDto saveRoutine(RoutineDto routine) {
        for(RoutineItemDto item : routine.getRoutineItems()) {
            Node node = nodeRepository.findById(item.getNodeId())
                .orElseThrow( () -> new AppException("Node not Found", HttpStatus.NOT_FOUND));
            node.setNumberOfTimesPracticed(node.getNumberOfTimesPracticed() + 1);
            long newTotalMillis = node.getTotalAmountOfTimePracticed().toMillis() + node.getEstimatedAmountOfTime().toMillis();
            node.setTotalAmountOfTimePracticed(Duration.ofMillis(newTotalMillis));
            double newAverage = (node.getAverage() * node.getNumberOfTimesPracticed() + item.getAchievedValue()) / node.getNumberOfTimesPracticed() + 1;
            node.setAverage(newAverage);
            List<Double> bpmList = node.getBpmList();
            bpmList.add(item.getAchievedValue());
            node.setBpmList(bpmList);
            nodeRepository.save(node);
        }
        return routine;
    }

    public Routine getOptimalRoutine(RoutineDto routineDto) {
        Network network = networkRepository.findById(Long.valueOf(routineDto.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        List<Node> actionNodes = network.getNodes().stream()
            .filter(node -> node.getEstimatedAmountOfTime() != null && 
                            !node.getTitle().equalsIgnoreCase("Inactive") &&
                            node.getEstimatedAmountOfTime().toMillis() > 0)
            .collect(Collectors.toList());

        if (actionNodes.isEmpty()) {
            throw new AppException("No valid actions found in the network", HttpStatus.BAD_REQUEST);
        }

        // Parse totalMinutes from RoutineDto and convert to milliseconds
        long maxTime = parseMinutesToMilliseconds(routineDto.getTotalMinutes());

        // Genetic Algorithm Parameters
        GeneticAlgorithm ga = new GeneticAlgorithm(1.0, 0.1, 0.8, 25, 50, maxTime);
        List<Node> bestSolution = ga.optimize(actionNodes);

        // Generate Routine from Best Solution
        Routine routine = new Routine();
        List<RoutineItem> routineItems = new ArrayList<>();

        long currentTime = 0;
        for (Node node : bestSolution) {
            long time = node.getEstimatedAmountOfTime().toMillis();
            if (currentTime + time > maxTime) break;

            RoutineItem item = new RoutineItem();
            item.setAmountOfTime(time);
            item.setItemName(node.getTitle());
            item.setNodeId(node.getId());
            item.setNodeDescription(node.getDescription());
            item.setRoutine(routine);
            routineItems.add(item);
            currentTime += time;
        }
        routine.setRoutineItems(routineItems);
        return routine;
    }

    private long parseMinutesToMilliseconds(String totalMinutes) {
        try {
            int minutes = Integer.parseInt(totalMinutes);
            return minutes * 60L * 1000L; // Convert minutes to milliseconds
        } catch (NumberFormatException e) {
            throw new AppException("Invalid totalMinutes format: " + totalMinutes, HttpStatus.BAD_REQUEST);
        }
    }



     
}
