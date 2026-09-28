package com.backend.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.stream.Collectors;


import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
 

import com.backend.dtos.CloneNetworkRequest;
import com.backend.dtos.EdgeDto;
import com.backend.dtos.MarketplaceNetworkDto;
import com.backend.dtos.MergeNetworksRequest;
import com.backend.dtos.NetworkDto;
import com.backend.dtos.NodeDto;
import com.backend.dtos.PublishNetworkRequest;
import com.backend.dtos.RoutineDto;
import com.backend.dtos.SplitNetworkRequest;
import com.backend.dtos.RoutineItemDto;
import com.backend.dtos.SaveNodeRequest;
import com.backend.dtos.SaveNodeResponse;
import com.backend.dtos.SetNetworkVisibilityRequest;
import com.backend.dtos.UserSummaryDto;
import com.backend.entites.Edge;
import com.backend.entites.Node;
import com.backend.entites.Routine;
import com.backend.entites.RoutineItem;
import com.backend.entites.User;
import com.backend.entites.Folder;
import com.backend.exceptions.AppException;
import com.backend.entites.Network;
import com.backend.repositories.EdgeRepository;
import com.backend.repositories.FolderRepository;
import com.backend.repositories.NetworkRepository;
import com.backend.repositories.NodeRepository;
import com.backend.repositories.RoutineRepository;
import com.backend.dtos.MoveNetworkRequest;
import java.util.ArrayDeque;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;




@RequiredArgsConstructor
@Service
public class NetworkService {

    private static final String ACTION_COLOR = "#7FC6A4";
    private static final String CATEGORY_COLOR = "#FFD166";
    // A leaf node that's just reference material (e.g. music theory notes) rather than
    // something to practice - deliberately excluded from routine generation the same way
    // Category nodes already are (see the ACTION_COLOR-only filter in createRoutine).
    private static final String INFO_COLOR = "#6FA8DC";
    private static final String ROOT_COLOR_HEX = "#808080";
    private static final int DEFAULT_ESTIMATED_MINUTES = 15;

    private final NetworkRepository networkRepository;

    private final UserService userService;

    private final NodeRepository nodeRepository;

    private final EdgeRepository edgeRepository;

    private final RoutineRepository routineRepository;

    private final FolderRepository folderRepository;

    private final FriendService friendService;

    public List<Network> getUserNetworksByLogin(String login) {
        User user = userService.getUser(login);
        return user.getNetworks().stream().map(this::mapNetwork).collect(Collectors.toList());
    }

    private Network mapNetwork(Network network) {
        Network result = new Network();
        result.setId(network.getId());
        result.setName(network.getName());
        result.setFolder(network.getFolder());
        result.setPublished(network.isPublished());
        result.setPublishedAt(network.getPublishedAt());
        result.setVisibleToFriends(network.isVisibleToFriends());
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
        Folder folder = resolveOwnedFolder(networkDto.folderId(), networkDto.login());

        // Check if the network name is already in use by this user in this same folder
        if (networkRepository.findByNameAndUserAndFolder(networkDto.name(), user, folder).isPresent()) {
            throw new AppException("Network name is already in use by this user", HttpStatus.CONFLICT);
        }



        // An imported file (see the "Import Network" flow in NetworkCreator) brings its own
        // Root Node along as one of networkDto.nodes() - only synthesize one here for the
        // plain "just give it a name" creation path, where there's nothing to import at all.
        boolean isImport = networkDto.nodes() != null && !networkDto.nodes().isEmpty();
        if (isImport) {
            long rootCount = networkDto.nodes().stream()
                .filter(n -> ROOT_COLOR_HEX.equalsIgnoreCase(n.getColor()))
                .count();
            if (rootCount != 1) {
                throw new AppException("Imported network must include exactly one Root Node", HttpStatus.BAD_REQUEST);
            }
        }

        // Create new Network instance
        Network network = Network.builder()
                                 .name(networkDto.name())
                                 .folder(folder)
                                 .nodes(new ArrayList<>()) // Initialize nodes list
                                 .edges(new ArrayList<>()) // Initialize edges list
                                 .build();

        if (!isImport) {
            Node initialNode = Node.builder()
                                    .label("Root Node")
                                    .title("Root Node")
                                    .color(ROOT_COLOR_HEX)
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
                // Full field copy (not just label/title/color) so a network round-trips
                // losslessly through export -> import, the same set cloneNetwork already
                // copies for marketplace/friend clones.
                Node node = Node.builder()
                                .label(nodeDto.getLabel())
                                .title(nodeDto.getTitle())
                                .color(nodeDto.getColor())
                                .description(nodeDto.getDescription())
                                .estimatedAmountOfTime(nodeDto.getEstimatedAmountOfTime())
                                .difficulty(nodeDto.getDifficulty())
                                .priority(nodeDto.getPriority())
                                .areaOfFocus(nodeDto.isAreaOfFocus())
                                .quantifierLabel(nodeDto.getQuantifierLabel())
                                .network(savedNetwork) // Set this node's network
                                .build();
                Node savedNode = nodeRepository.save(node);
                savedNetwork.getNodes().add(savedNode);
                idNodeMap.put(Long.valueOf(nodeDto.getId()), savedNode); // Convert String to Long
            }
        }

        // Save the network again to ensure nodes are persisted
        savedNetwork = networkRepository.save(savedNetwork);

        // Handle edges
        if (networkDto.edges() != null) {
            for (EdgeDto edgeDto : networkDto.edges()) {
                Node fromNode = idNodeMap.get(Long.valueOf(edgeDto.getFrom())); // Convert String to Long
                Node toNode = idNodeMap.get(Long.valueOf(edgeDto.getTo())); // Convert String to Long

                if (fromNode == null || toNode == null) {
                    throw new AppException("Node Not Found: " + (fromNode == null ? edgeDto.getFrom() : edgeDto.getTo()), HttpStatus.NOT_FOUND);
                }

                // Same cycle/Root-Node guard createEdge uses - an imported file is untrusted
                // input, so it shouldn't be able to hand the app a graph its own editor would
                // never let you build by hand.
                validateEdgeEndpoints(fromNode, toNode, savedNetwork.getEdges());

                Edge edge = Edge.builder()
                                .from(fromNode)
                                .to(toNode)
                                .network(savedNetwork) // Set this edge's network
                                .build();
                Edge savedEdge = edgeRepository.save(edge);
                savedNetwork.getEdges().add(savedEdge);
            }
        }

        // Save and return the updated network
        return networkRepository.save(savedNetwork);
    }


    public void deleteNetwork(Long id) {
        networkRepository.deleteById(id);
    }

    @Transactional
    public Network moveNetwork(MoveNetworkRequest request) {
        Network network = networkRepository.findByIdAndUserLogin(Long.valueOf(request.getId()), request.getLogin())
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));
        Folder folder = resolveOwnedFolder(request.getFolderId(), request.getLogin());

        if (networkRepository.findByNameAndUserAndFolder(network.getName(), network.getUser(), folder)
                .filter(existing -> !existing.getId().equals(network.getId()))
                .isPresent()) {
            throw new AppException("Network name is already in use by this user", HttpStatus.CONFLICT);
        }

        network.setFolder(folder);
        return networkRepository.save(network);
    }

    @Transactional
    public Network setNetworkPublished(PublishNetworkRequest request) {
        Network network = networkRepository.findByIdAndUserLogin(Long.valueOf(request.getId()), request.getLogin())
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));

        network.setPublished(request.isPublished());
        // Re-stamped every time a network is (re-)published, not just the first time - so
        // unpublishing and republishing later bumps it back to the top of the marketplace's
        // newest-first ordering, matching what a user would expect from "sharing it again".
        // Deliberately left untouched (not nulled) on unpublish: marketplace listing already
        // filters on `published`, so nothing reads a stale publishedAt while unpublished, and
        // the publish-related badges (see UserService) use "has this network ever been
        // published" to decide progress - clearing it here would make an already-earned badge
        // look locked again the moment a network is unpublished.
        if (request.isPublished()) {
            network.setPublishedAt(LocalDateTime.now());
        }

        return networkRepository.save(network);
    }

    @Transactional
    public Network setNetworkVisibleToFriends(SetNetworkVisibilityRequest request) {
        Network network = networkRepository.findByIdAndUserLogin(Long.valueOf(request.getId()), request.getLogin())
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));

        network.setVisibleToFriends(request.isVisibleToFriends());
        return networkRepository.save(network);
    }

    // Every accepted friend's networks that they haven't marked private, newest first. Reuses
    // MarketplaceNetworkDto (same "id/name/owner/nodes/edges" shape a browsing card needs) even
    // though these networks were never published - publishedAt just comes through null for
    // those, which the frontend doesn't render for this feed anyway.
    public List<MarketplaceNetworkDto> getFriendsNetworks(String login) {
        List<String> friendLogins = friendService.getFriends(login).stream()
            .map(UserSummaryDto::getLogin)
            .collect(Collectors.toList());
        if (friendLogins.isEmpty()) {
            return List.of();
        }
        return networkRepository.findFriendsNetworks(friendLogins).stream()
            .map(this::toMarketplaceDto)
            .collect(Collectors.toList());
    }

    // Powers a single friend-network preview page, the same way getMarketplaceNetwork powers
    // the marketplace's detail page - not ownership-scoped, but guarded so only an actual
    // friend of the owner (and only while the owner hasn't marked it private) can look it up by
    // id directly.
    public MarketplaceNetworkDto getFriendNetwork(Long id, String viewerLogin) {
        Network network = networkRepository.findById(id)
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));
        boolean visible = network.isVisibleToFriends() && friendService.areFriends(viewerLogin, network.getUser().getLogin());
        if (!visible) {
            throw new AppException("This network is not visible to you", HttpStatus.FORBIDDEN);
        }
        return toMarketplaceDto(network);
    }

    // excludeLogin (usually the caller's own login) is omitted from results - the marketplace
    // is for finding *other* members' networks, so there's no point showing your own back to
    // you here (you already see those on your own dashboard).
    public List<MarketplaceNetworkDto> browseMarketplace(String search, String excludeLogin) {
        List<Network> results = (search == null || search.isBlank())
            ? networkRepository.findByPublishedTrueOrderByPublishedAtDesc()
            : networkRepository.findByPublishedTrueAndNameContainingIgnoreCaseOrderByPublishedAtDesc(search);

        return results.stream()
            .filter(network -> excludeLogin == null || !network.getUser().getLogin().equals(excludeLogin))
            .map(this::toMarketplaceDto)
            .collect(Collectors.toList());
    }

    // Powers the marketplace preview page - deliberately not ownership-scoped (unlike
    // getNetwork), since any member should be able to look at a published network before
    // deciding to add it to their own collection. Still guarded by isPublished so an
    // unpublished (or since-unpublished) network's id can't be browsed to directly.
    public MarketplaceNetworkDto getMarketplaceNetwork(Long id) {
        Network network = networkRepository.findById(id)
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));
        if (!network.isPublished()) {
            throw new AppException("This network is not available on the marketplace", HttpStatus.FORBIDDEN);
        }
        return toMarketplaceDto(network);
    }

    private MarketplaceNetworkDto toMarketplaceDto(Network network) {
        User owner = network.getUser();
        return MarketplaceNetworkDto.builder()
            .id(network.getId())
            .name(network.getName())
            .ownerLogin(owner.getLogin())
            .ownerName((owner.getFirstName() + " " + owner.getLastName()).trim())
            .publishedAt(network.getPublishedAt())
            .nodes(network.getNodes())
            .edges(network.getEdges())
            .build();
    }

    // Deep-copies every node field (not just label/title/color, unlike the JSON-import path
    // in createNetwork - a marketplace network is meant to be usable immediately, including
    // whatever priority/difficulty/estimated-time/description the original author set up) into
    // a brand-new Network owned by the requesting user. Practice history
    // (numberOfTimesPracticed, totalAmountOfTimePracticed, average, quantifierValues) is
    // deliberately left at its defaults - that's the original owner's usage history, not part
    // of the template being shared.
    @Transactional
    public Network cloneNetwork(CloneNetworkRequest request) {
        Network source = networkRepository.findById(Long.valueOf(request.getNetworkId()))
            .orElseThrow(() -> new AppException("Network not found", HttpStatus.NOT_FOUND));
        // Cloneable either because it's on the public marketplace, or because the requester is
        // a friend of the owner and the owner hasn't marked this specific network private.
        boolean cloneableAsFriend = source.isVisibleToFriends()
            && friendService.areFriends(request.getLogin(), source.getUser().getLogin());
        if (!source.isPublished() && !cloneableAsFriend) {
            throw new AppException("This network is not available to clone", HttpStatus.FORBIDDEN);
        }

        User user = userService.getUser(request.getLogin());
        Folder folder = resolveOwnedFolder(request.getFolderId(), request.getLogin());
        String name = uniqueNetworkName(source.getName(), user, folder);

        Network newNetwork = Network.builder()
            .name(name)
            .folder(folder)
            .user(user)
            .nodes(new ArrayList<>())
            .edges(new ArrayList<>())
            .build();
        Network savedNetwork = networkRepository.save(newNetwork);

        Map<Long, Node> idMap = new HashMap<>();
        for (Node original : source.getNodes()) {
            Node copy = Node.builder()
                .label(original.getLabel())
                .title(original.getTitle())
                .color(original.getColor())
                .description(original.getDescription())
                .estimatedAmountOfTime(original.getEstimatedAmountOfTime())
                .difficulty(original.getDifficulty())
                .priority(original.getPriority())
                .areaOfFocus(original.isAreaOfFocus())
                .quantifierLabel(original.getQuantifierLabel())
                .network(savedNetwork)
                .build();
            Node savedCopy = nodeRepository.save(copy);
            savedNetwork.getNodes().add(savedCopy);
            idMap.put(original.getId(), savedCopy);
        }

        for (Edge original : source.getEdges()) {
            Node from = idMap.get(original.getFrom().getId());
            Node to = idMap.get(original.getTo().getId());
            Edge copy = Edge.builder().from(from).to(to).network(savedNetwork).build();
            savedNetwork.getEdges().add(edgeRepository.save(copy));
        }

        return networkRepository.save(savedNetwork);
    }

    // Marketplace clones shouldn't fail with a 409 just because the user already has a
    // network with that name (e.g. they clicked "Add to My Collection" twice, or the name is
    // just common) - silently disambiguating keeps that action feeling seamless instead of
    // bouncing the user into an error they have to resolve by hand.
    private String uniqueNetworkName(String baseName, User user, Folder folder) {
        String name = baseName;
        int suffix = 2;
        while (networkRepository.findByNameAndUserAndFolder(name, user, folder).isPresent()) {
            name = baseName + " (" + suffix + ")";
            suffix++;
        }
        return name;
    }

    // Absorbs `source` into `target`: every node of source is deep-copied (full fields, same
    // as cloneNetwork - a merged-in network should stay just as usable as it was on its own)
    // into target, source's own root becomes a category node titled after the source network
    // (so "Improvising" the network becomes an "Improvising" category inside the combined
    // network), wired to target's root with a fresh edge, and source is deleted once the copy
    // succeeds - the whole point is consolidating into one network, not keeping two.
    @Transactional
    public Network mergeNetworks(MergeNetworksRequest request) {
        Network target = networkRepository.findByIdAndUserLogin(Long.valueOf(request.getTargetNetworkId()), request.getLogin())
            .orElseThrow(() -> new AppException("Target network not found", HttpStatus.NOT_FOUND));
        Network source = networkRepository.findByIdAndUserLogin(Long.valueOf(request.getSourceNetworkId()), request.getLogin())
            .orElseThrow(() -> new AppException("Source network not found", HttpStatus.NOT_FOUND));

        if (target.getId().equals(source.getId())) {
            throw new AppException("Cannot merge a network into itself", HttpStatus.BAD_REQUEST);
        }

        Node targetRoot = target.getNodes().stream()
            .filter(n -> ROOT_COLOR_HEX.equalsIgnoreCase(n.getColor()))
            .findFirst()
            .orElseThrow(() -> new AppException("Target network has no root node", HttpStatus.CONFLICT));
        Node sourceRoot = source.getNodes().stream()
            .filter(n -> ROOT_COLOR_HEX.equalsIgnoreCase(n.getColor()))
            .findFirst()
            .orElseThrow(() -> new AppException("Source network has no root node", HttpStatus.CONFLICT));

        Map<Long, Node> idMap = new HashMap<>();
        for (Node original : source.getNodes()) {
            boolean isSourceRoot = original.getId().equals(sourceRoot.getId());
            Node copy = Node.builder()
                .label(isSourceRoot ? source.getName() : original.getLabel())
                .title(isSourceRoot ? source.getName() : original.getTitle())
                .color(isSourceRoot ? CATEGORY_COLOR : original.getColor())
                .description(original.getDescription())
                .estimatedAmountOfTime(original.getEstimatedAmountOfTime())
                .difficulty(original.getDifficulty())
                .priority(original.getPriority())
                .areaOfFocus(original.isAreaOfFocus())
                .quantifierLabel(original.getQuantifierLabel())
                .network(target)
                .build();
            Node savedCopy = nodeRepository.save(copy);
            target.getNodes().add(savedCopy);
            idMap.put(original.getId(), savedCopy);
        }

        for (Edge original : source.getEdges()) {
            Node from = idMap.get(original.getFrom().getId());
            Node to = idMap.get(original.getTo().getId());
            Edge copy = Edge.builder().from(from).to(to).network(target).build();
            target.getEdges().add(edgeRepository.save(copy));
        }

        Node mergedRootCopy = idMap.get(sourceRoot.getId());
        Edge connectingEdge = Edge.builder().from(targetRoot).to(mergedRootCopy).network(target).build();
        target.getEdges().add(edgeRepository.save(connectingEdge));

        Network savedTarget = networkRepository.save(target);
        networkRepository.delete(source);

        return savedTarget;
    }

    // Extracts a category or info node and everything reachable from it (its full descendant
    // subtree) out of its current network and into a brand-new one, where it becomes the
    // Root Node - the inverse of mergeNetworks. Traversal is done over plain node ids rather
    // than Node objects themselves: Node is a Lombok @Data entity with bidirectional
    // associations (edgesFrom/edgesTo/network), so using Node instances as Set/Map keys would
    // route through generated equals/hashCode that walks that whole object graph - id-based
    // keys sidestep that risk entirely.
    @Transactional
    public Network splitNetwork(SplitNetworkRequest request) {
        Node splitNode = nodeRepository.findById(Long.valueOf(request.getNodeId()))
            .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));
        Network sourceNetwork = splitNode.getNetwork();

        if (!sourceNetwork.getUser().getLogin().equals(request.getLogin())) {
            throw new AppException("Node not found", HttpStatus.NOT_FOUND);
        }
        if (!CATEGORY_COLOR.equalsIgnoreCase(splitNode.getColor()) && !INFO_COLOR.equalsIgnoreCase(splitNode.getColor())) {
            throw new AppException("Only category or info nodes can be split into a new network", HttpStatus.BAD_REQUEST);
        }

        User user = userService.getUser(request.getLogin());
        Folder folder = resolveOwnedFolder(request.getFolderId(), request.getLogin());
        String requestedName = request.getNewNetworkName();
        String baseName = (requestedName != null && !requestedName.isBlank()) ? requestedName : splitNode.getTitle();
        String uniqueName = uniqueNetworkName(baseName, user, folder);

        Set<Long> subtreeNodeIds = collectDescendantIds(splitNode.getId(), sourceNetwork.getEdges());
        List<Node> subtreeNodes = sourceNetwork.getNodes().stream()
            .filter(n -> subtreeNodeIds.contains(n.getId()))
            .collect(Collectors.toList());
        List<Edge> internalEdges = sourceNetwork.getEdges().stream()
            .filter(e -> subtreeNodeIds.contains(e.getFrom().getId()) && subtreeNodeIds.contains(e.getTo().getId()))
            .collect(Collectors.toList());
        // Edges from outside the subtree into the split node (its old parent link(s)) no
        // longer make sense once it's the root of a different network, so they're dropped
        // rather than moved.
        List<Edge> incomingEdges = sourceNetwork.getEdges().stream()
            .filter(e -> subtreeNodeIds.contains(e.getTo().getId()) && !subtreeNodeIds.contains(e.getFrom().getId()))
            .collect(Collectors.toList());

        Network newNetwork = Network.builder()
            .name(uniqueName)
            .folder(folder)
            .user(user)
            .nodes(new ArrayList<>())
            .edges(new ArrayList<>())
            .build();
        Network savedNewNetwork = networkRepository.save(newNetwork);

        splitNode.setColor(ROOT_COLOR_HEX);
        splitNode.setTitle("Root Node");
        splitNode.setLabel("Root Node");

        for (Node n : subtreeNodes) {
            n.setNetwork(savedNewNetwork);
            savedNewNetwork.getNodes().add(nodeRepository.save(n));
        }

        for (Edge e : internalEdges) {
            e.setNetwork(savedNewNetwork);
            savedNewNetwork.getEdges().add(edgeRepository.save(e));
        }

        for (Edge e : incomingEdges) {
            edgeRepository.delete(e);
        }

        return networkRepository.save(savedNewNetwork);
    }

    // Plain-id BFS/DFS over a network's own edge list - see splitNetwork's comment for why
    // this avoids using Node instances as Set/Map keys.
    private Set<Long> collectDescendantIds(Long startId, List<Edge> edges) {
        Map<Long, List<Long>> adjacency = new HashMap<>();
        for (Edge e : edges) {
            adjacency.computeIfAbsent(e.getFrom().getId(), k -> new ArrayList<>()).add(e.getTo().getId());
        }

        Set<Long> visited = new HashSet<>();
        Deque<Long> stack = new ArrayDeque<>();
        stack.push(startId);
        while (!stack.isEmpty()) {
            Long current = stack.pop();
            if (!visited.add(current)) continue;
            for (Long childId : adjacency.getOrDefault(current, Collections.emptyList())) {
                if (!visited.contains(childId)) stack.push(childId);
            }
        }
        return visited;
    }

    // Blocks the two ways an edge could break the tree-like flow the app assumes elsewhere
    // (routine generation walks the graph as a DAG rooted at the Root Node - see
    // createRoutine/topologicalSort): pointing into the Root Node (it must only ever be a
    // source, never a destination) and closing a cycle. A self-loop is just the smallest
    // possible cycle, so it falls out of the same reachability check rather than needing its
    // own special case.
    private void validateEdgeEndpoints(Node fromNode, Node toNode, List<Edge> existingEdges) {
        if (ROOT_COLOR_HEX.equalsIgnoreCase(toNode.getColor())) {
            throw new AppException("Edges can't point into the Root Node", HttpStatus.BAD_REQUEST);
        }
        // Adding from -> to would create a cycle exactly when `from` is already reachable
        // starting from `to` in the existing graph - that walk already includes `to` itself,
        // which is what catches a direct from == to self-loop too.
        if (collectDescendantIds(toNode.getId(), existingEdges).contains(fromNode.getId())) {
            throw new AppException("This edge would create a cycle", HttpStatus.BAD_REQUEST);
        }
    }

    // Null/blank folderId means "top level" (no folder).
    private Folder resolveOwnedFolder(String folderId, String login) {
        if (folderId == null || folderId.isBlank()) {
            return null;
        }
        return folderRepository.findByIdAndUserLogin(Long.valueOf(folderId), login)
            .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND));
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
        Network newNetwork = networkRepository.findById(Long.valueOf(edge.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node toNode = nodeRepository.findById(Long.valueOf(edge.getTo()))
            .orElseThrow(() -> new AppException("Node Not Found", HttpStatus.NOT_FOUND));

        Node fromNode = nodeRepository.findById(Long.valueOf(edge.getFrom()))
            .orElseThrow(() -> new AppException("Edge Not Found", HttpStatus.NOT_FOUND));

        validateEdgeEndpoints(fromNode, toNode, newNetwork.getEdges());

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
        edgeRepository.deleteById(Long.valueOf(edge.getId()));
    }

    
    public Edge editEdge(EdgeDto edge) {
        Network newNetwork = networkRepository.findById(Long.valueOf(edge.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node toNode = nodeRepository.findById(Long.valueOf(edge.getTo()))
            .orElseThrow(() -> new AppException("Node Not Found", HttpStatus.NOT_FOUND));

        Node fromNode = nodeRepository.findById(Long.valueOf(edge.getFrom()))
            .orElseThrow(() -> new AppException("Edge Not Found", HttpStatus.NOT_FOUND));

        // Exclude the edge being edited from the graph used to check the new endpoints -
        // otherwise its own old from/to would count toward reachability and every edit would
        // spuriously look like it recreates the same edge (a 1-node "cycle").
        List<Edge> otherEdges = newNetwork.getEdges().stream()
            .filter(e -> !e.getId().equals(Long.valueOf(edge.getId())))
            .collect(Collectors.toList());
        validateEdgeEndpoints(fromNode, toNode, otherEdges);

        Edge newEdge = Edge.builder()
            .id(Long.valueOf(edge.getId()))
            .to(toNode)
            .from(fromNode)
            .network(newNetwork)
            .build();

        Edge savedEdge = edgeRepository.save(newEdge);

        List<Edge> edges = newNetwork.getEdges();
        for (int i = 0  ; i < edges.size() ; i++) {
            if (edges.get(i).getId().equals(Long.valueOf(edge.getId()))) {
                edges.set(i, savedEdge);
            }
        }
        newNetwork.setEdges(edges);
        networkRepository.save(newNetwork);

        return savedEdge;
    }

    @Transactional
    public Node editNode(NodeDto nodeDto) {
        Network newNetwork = networkRepository.findById(Long.valueOf(nodeDto.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        Node node = nodeRepository.findById(Long.parseLong(nodeDto.getId()))
                .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));


        node.setTitle(nodeDto.getTitle());
        node.setLabel(nodeDto.getLabel());
        node.setColor(nodeDto.getColor());
        
        Node savedNode = nodeRepository.save(node);

        List<Node> nodes = newNetwork.getNodes();
        for (int i = 0 ; i < nodes.size() ; i++) {
            if (nodes.get(i).getId().equals(Long.valueOf(nodeDto.getId()))) {
                nodes.set(i,savedNode);
            }
        }
        newNetwork.setNodes(nodes);
        networkRepository.save(newNetwork);

        return savedNode;
    }

    // Creates a brand-new node (id blank/null) or updates an existing one (id present) - the
    // same endpoint on purpose. A node is only ever persisted once it already has everything
    // (at minimum, a title) filled in - there's no more "blank placeholder node created up
    // front, filled in later" step, so nothing shows up in the graph until it's actually ready.
    // When creating as a child of another node (parentNodeId set), the edge to that parent is
    // created in the same transaction, so a node can never end up created-but-unconnected.
    @Transactional
    public SaveNodeResponse saveNode(SaveNodeRequest request) {
        Network network = networkRepository.findById(Long.valueOf(request.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));

        boolean isCreate = request.getId() == null || request.getId().isBlank();

        Node node;
        if (isCreate) {
            node = Node.builder().network(network).build();
        } else {
            node = nodeRepository.findById(Long.parseLong(request.getId()))
                .orElseThrow(() -> new AppException("Node not found", HttpStatus.NOT_FOUND));
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new AppException("Title is required", HttpStatus.BAD_REQUEST);
        }
        node.setTitle(request.getTitle());
        if (request.getLabel() != null && !request.getLabel().isBlank()) {
            node.setLabel(request.getLabel());
        } else if (isCreate) {
            node.setLabel(request.getTitle());
        }

        if (request.getColor() != null && !request.getColor().isBlank()) {
            String color = request.getColor();
            if (!ACTION_COLOR.equalsIgnoreCase(color) && !CATEGORY_COLOR.equalsIgnoreCase(color) && !INFO_COLOR.equalsIgnoreCase(color)) {
                throw new AppException("Invalid node type", HttpStatus.BAD_REQUEST);
            }
            node.setColor(color);
        } else if (isCreate) {
            node.setColor(ACTION_COLOR);
        }

        // Everything below is an optional "advanced" attribute - only touch the node's
        // existing value when the request actually provided one.
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            node.setPriority(Integer.parseInt(request.getPriority()));
        }
        if (request.getDifficulty() != null && !request.getDifficulty().isBlank()) {
            node.setDifficulty(Integer.parseInt(request.getDifficulty()));
        }
        if (request.getDescription() != null) {
            node.setDescription(request.getDescription());
        }
        if (request.getQuantifierLabel() != null) {
            String quantifierLabel = request.getQuantifierLabel().trim();
            node.setQuantifierLabel(quantifierLabel.isEmpty() ? null : quantifierLabel);
        }
        if (request.getIsAreaOfFocus() != null && !request.getIsAreaOfFocus().isBlank()) {
            node.setAreaOfFocus(Boolean.parseBoolean(request.getIsAreaOfFocus()));
        }

        boolean hasMinutes = request.getEstimatedMinutes() != null && !request.getEstimatedMinutes().isBlank();
        boolean hasSeconds = request.getEstimatedSeconds() != null && !request.getEstimatedSeconds().isBlank();
        if (hasMinutes || hasSeconds) {
            int minutes = hasMinutes ? Integer.parseInt(request.getEstimatedMinutes()) : 0;
            int seconds = hasSeconds ? Integer.parseInt(request.getEstimatedSeconds()) : 0;
            node.setEstimatedAmountOfTime(Duration.ofMinutes(minutes).plusSeconds(seconds));
        }

        Node savedNode = nodeRepository.save(node);
        Edge savedEdge = null;

        if (isCreate) {
            network.getNodes().add(savedNode);
            networkRepository.save(network);

            if (request.getParentNodeId() != null && !request.getParentNodeId().isBlank()) {
                Node parent = nodeRepository.findById(Long.parseLong(request.getParentNodeId()))
                    .orElseThrow(() -> new AppException("Parent node not found", HttpStatus.NOT_FOUND));
                Edge edge = Edge.builder().from(parent).to(savedNode).network(network).build();
                savedEdge = edgeRepository.save(edge);
                network.getEdges().add(savedEdge);
                networkRepository.save(network);
            }
        } else {
            List<Node> nodes = network.getNodes();
            for (int i = 0; i < nodes.size(); i++) {
                if (nodes.get(i).getId().equals(savedNode.getId())) {
                    nodes.set(i, savedNode);
                }
            }
            networkRepository.save(network);
        }

        return SaveNodeResponse.builder().node(savedNode).edge(savedEdge).build();
    }

    private List<Node> topologicalSort(List<Node> nodes, Map<Node, List<Node>> adjacency) {
        Map<Node, Integer> indegree = new HashMap<>();
        Set<Node> nodeSet = new HashSet<>(nodes);
        for (Node n : nodes) {
            indegree.put(n, 0);
        }
        for (Node u : nodes) {
            for (Node v : adjacency.getOrDefault(u, Collections.emptyList())) {
                if (nodeSet.contains(v)) {
                    indegree.put(v, indegree.get(v) + 1);
                }
            }
        }

        ArrayDeque<Node> queue = new ArrayDeque<>();
        for (Node n : nodes) {
            if (indegree.get(n) == 0) queue.add(n);
        }

        List<Node> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            Node u = queue.poll();
            order.add(u);
            for (Node v : adjacency.getOrDefault(u, Collections.emptyList())) {
                if (!nodeSet.contains(v)) continue;
                indegree.put(v, indegree.get(v) - 1);
                if (indegree.get(v) == 0) queue.add(v);
            }
        }

        return order.size() == nodes.size() ? order : order;
    }

    private Map<Node, Set<Node>> computeTransitivePrerequisites(List<Node> topo, Map<Node, List<Node>> adjacency) {
        Map<Node, List<Node>> reverse = new HashMap<>();
        for (Node n : topo) reverse.put(n, new ArrayList<>());
        for (Node u : topo) {
            for (Node v : adjacency.getOrDefault(u, Collections.emptyList())) {
                if (reverse.containsKey(v)) reverse.get(v).add(u);
            }
        }

        Map<Node, Set<Node>> memo = new HashMap<>();
        for (Node n : topo) {
            computePrereqsDfs(n, reverse, memo, new HashSet<>());
        }
        return memo;
    }

    private Set<Node> computePrereqsDfs(Node node, Map<Node, List<Node>> reverse, Map<Node, Set<Node>> memo, Set<Node> visiting) {
        if (memo.containsKey(node)) return memo.get(node);
        if (visiting.contains(node)) return Collections.emptySet();
        visiting.add(node);
        Set<Node> result = new HashSet<>();
        for (Node parent : reverse.getOrDefault(node, Collections.emptyList())) {
            result.add(parent);
            result.addAll(computePrereqsDfs(parent, reverse, memo, visiting));
        }
        visiting.remove(node);
        memo.put(node, result);
        return result;
    }

    @Transactional
    public Routine createRoutine(RoutineDto routine) {
        Network network = networkRepository.findById(Long.valueOf(routine.getNetworkId()))
            .orElseThrow(() -> new AppException("Network Not Found", HttpStatus.NOT_FOUND));
        User user = userService.getUser(routine.getLogin());

        int capacityMinutes = Integer.parseInt(routine.getTotalMinutes());
        if (capacityMinutes <= 0) {
            throw new AppException("No subset of actions fits in this time constraint", HttpStatus.BAD_REQUEST);
        }

        // 1) Filter action nodes (exclude category nodes and label "Inactive", include only action nodes).
        // Estimated time is optional on a node, so it is intentionally NOT required here - a node
        // missing it still gets a fair shot at being scheduled via the fallback default computed below.
        List<Node> actionNodes = network.getNodes().stream()
            .filter(n -> !"Inactive".equalsIgnoreCase(n.getLabel()))
            .filter(n -> ACTION_COLOR.equalsIgnoreCase(n.getColor()))
            .collect(Collectors.toList());

        if (actionNodes.isEmpty()) {
            throw new AppException("No subset of actions fits in this time constraint", HttpStatus.BAD_REQUEST);
        }

        // Nodes without their own estimated time fall back to the average of nodes in this
        // network that do have one set, or a flat default if none do. That guess is then
        // capped against the requested time budget - split fairly across however many
        // untimed candidates exist - so a guess can never by itself exceed (or single-
        // handedly consume) the whole session. Without this cap, a short requested routine
        // (e.g. 10 minutes) with nothing ever timed would have every candidate's assumed
        // weight (the flat default) exceed the budget, and nothing could ever be scheduled -
        // the whole point of this feature is to still produce a usable routine under exactly
        // that kind of uncertainty.
        OptionalDouble avgKnownMinutes = actionNodes.stream()
            .filter(n -> n.getEstimatedAmountOfTime() != null)
            .mapToLong(n -> n.getEstimatedAmountOfTime().toMinutes())
            .filter(m -> m > 0)
            .average();
        int baselineMinutes = avgKnownMinutes.isPresent()
            ? Math.max(1, (int) Math.round(avgKnownMinutes.getAsDouble()))
            : DEFAULT_ESTIMATED_MINUTES;

        long unknownDurationCount = actionNodes.stream()
            .filter(n -> n.getEstimatedAmountOfTime() == null)
            .count();
        int fairShareCeiling = unknownDurationCount > 1
            ? Math.max(1, capacityMinutes / (int) unknownDurationCount)
            : capacityMinutes;
        int defaultMinutes = Math.max(1, Math.min(baselineMinutes, fairShareCeiling));

        // 2) Build adjacency list and prerequisite map
        Map<Node, List<Node>> adjacency = network.getAdjacencyList();
        // Restrict adjacency to actionNodes only
        Set<Node> actionSet = new HashSet<>(actionNodes);
        Map<Node, List<Node>> prunedAdjacency = new HashMap<>();
        for (Node node : actionNodes) {
            List<Node> neighbors = adjacency.getOrDefault(node, Collections.emptyList())
                .stream().filter(actionSet::contains).collect(Collectors.toList());
            prunedAdjacency.put(node, neighbors);
        }

        // Topological sort on action nodes
        List<Node> topo = topologicalSort(actionNodes, prunedAdjacency);
        if (topo.isEmpty()) {
            throw new AppException("No subset of actions fits in this time constraint", HttpStatus.BAD_REQUEST);
        }

        // Build reverse adjacency for prerequisites and compute transitive prerequisite sets
        Map<Node, Set<Node>> prereqMap = computeTransitivePrerequisites(topo, prunedAdjacency);

        // 3) Prepare values and weights in topo order
        int n = topo.size();
        int[] weights = new int[n];
        int[] values = new int[n];
        for (int i = 0; i < n; i++) {
            Node node = topo.get(i);
            weights[i] = Math.max(0, effectiveMinutes(node, defaultMinutes));
            // Priority/difficulty are optional and default to 0 when never set by the user.
            // Floor value at 1 so an unrated node still has something to gain by being
            // included - a strict 0 would never win the DP's ">" comparison and would
            // silently be excluded from every generated routine regardless of spare time.
            int value = node.getPriority() * 2 + node.getDifficulty();
            values[i] = Math.max(1, value);
        }

        // 4) 0/1 Knapsack DP
        double[][] dp = new double[n + 1][capacityMinutes + 1];
        boolean[][] keep = new boolean[n + 1][capacityMinutes + 1];
        for (int i = 1; i <= n; i++) {
            int w = weights[i - 1];
            int val = values[i - 1];
            for (int cap = 0; cap <= capacityMinutes; cap++) {
                if (w <= cap && dp[i - 1][cap - w] + val > dp[i - 1][cap]) {
                    dp[i][cap] = dp[i - 1][cap - w] + val;
                    keep[i][cap] = true;
                } else {
                    dp[i][cap] = dp[i - 1][cap];
                }
            }
        }

        // 5) Reconstruct a candidate set from DP
        Set<Node> dpChosen = new HashSet<>();
        int remCap = capacityMinutes;
        for (int i = n; i >= 1; i--) {
            if (keep[i][remCap]) {
                Node chosen = topo.get(i - 1);
                dpChosen.add(chosen);
                remCap -= weights[i - 1];
            }
        }

        // 6) Build dependency-safe ordered selection within capacity
        List<Node> finalSelection = new ArrayList<>();
        long timeUsed = 0;
        Set<Node> selectedSoFar = new HashSet<>();
        for (Node node : topo) {
            if (!dpChosen.contains(node)) continue;
            Set<Node> prereqs = prereqMap.getOrDefault(node, Collections.emptySet());
            if (!selectedSoFar.containsAll(prereqs)) {
                // Only include this node if all its prereqs were also chosen by DP and already selected
                boolean allPrereqsChosenByDp = dpChosen.containsAll(prereqs);
                if (!allPrereqsChosenByDp) continue;
                // Ensure capacity if we add any missing prereqs now (but due to topo order, any missing prereqs would have appeared earlier, so skip)
                if (!selectedSoFar.containsAll(prereqs)) continue;
            }
            long nodeMinutes = effectiveMinutes(node, defaultMinutes);
            if (timeUsed + nodeMinutes <= capacityMinutes) {
                finalSelection.add(node);
                selectedSoFar.add(node);
                timeUsed += nodeMinutes;
            }
        }

        if (finalSelection.isEmpty()) {
            throw new AppException("No subset of actions fits in this time constraint", HttpStatus.BAD_REQUEST);
        }

        // 7) Build and save Routine
        Routine newRoutine = Routine.builder().user(user).build();
        Routine savedRoutine = routineRepository.save(newRoutine);
        for (Node node : finalSelection) {
            long amountOfTimeMillis = node.getEstimatedAmountOfTime() != null
                ? node.getEstimatedAmountOfTime().toMillis()
                : Duration.ofMinutes(defaultMinutes).toMillis();
            RoutineItem routineItem = RoutineItem.builder()
                .amountOfTime(amountOfTimeMillis)
                .itemName(node.getTitle())
                .nodeId(node.getId())
                .nodeDescription(node.getDescription())
                .priority(node.getPriority())
                .difficulty(node.getDifficulty())
                .areaOfFocus(node.isAreaOfFocus())
                .quantifierLabel(node.getQuantifierLabel())
                .routine(savedRoutine)
                .build();
            savedRoutine.getRoutineItems().add(routineItem);
        }
        return routineRepository.save(savedRoutine);
    }

    private int effectiveMinutes(Node node, int defaultMinutes) {
        return node.getEstimatedAmountOfTime() != null
            ? (int) node.getEstimatedAmountOfTime().toMinutes()
            : defaultMinutes;
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
        
        List<Node> nodes = network.getNodes();

        for (Node node : nodes) {
            if (node.getEstimatedAmountOfTime() != null && !node.getTitle().equals("Inactive") && node.getEstimatedAmountOfTime().toMillis() != 0) {
                RoutineItem item = new RoutineItem();
                item.setAmountOfTime(node.getEstimatedAmountOfTime().toMillis());
                item.setItemName(node.getTitle());
                item.setNodeId(node.getId());
                item.setRoutine(routine);
                routine.getRoutineItems().add(item);
            }  
        }

        return routine;
    }

    public RoutineDto saveRoutine(RoutineDto routine) {
        // A completed routine is this app's equivalent of a Duolingo "lesson" - the one
        // recurring action worth building a daily streak around.
        userService.recordDailyActivity(userService.getUser(routine.getLogin()));

        for(RoutineItemDto item : routine.getRoutineItems()) {
            Node node = nodeRepository.findById(item.getNodeId())
                .orElseThrow( () -> new AppException("Node not Found", HttpStatus.NOT_FOUND));
            node.setNumberOfTimesPracticed(node.getNumberOfTimesPracticed() + 1);

            Duration practicedDuration = item.getAmountOfTime() != null ? item.getAmountOfTime() : Duration.ZERO;
            Duration existingTotal = node.getTotalAmountOfTimePracticed() != null ? node.getTotalAmountOfTimePracticed() : Duration.ZERO;
            node.setTotalAmountOfTimePracticed(existingTotal.plus(practicedDuration));

            // Only nodes that define their own quantifier collect achieved values - a node
            // without one (or an item the user skipped) has nothing meaningful to record here.
            if (node.getQuantifierLabel() != null && item.getAchievedValue() != null) {
                List<Double> quantifierValues = node.getQuantifierValues();
                if (quantifierValues == null) {
                    quantifierValues = new ArrayList<>();
                }
                quantifierValues.add(item.getAchievedValue());
                node.setQuantifierValues(quantifierValues);
                node.setAverage(quantifierValues.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
            }

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

        System.out.println(actionNodes);

        // Parse totalMinutes from RoutineDto and convert to milliseconds
        long maxTime = parseMinutesToMilliseconds(routineDto.getTotalMinutes());

        //Algorithm goes here
        List<Node> bestSolution = actionNodes;

        // Generate Routine from Best Solution
        Routine routine = new Routine();

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
            routine.getRoutineItems().add(item);
            currentTime += time;
        }
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
