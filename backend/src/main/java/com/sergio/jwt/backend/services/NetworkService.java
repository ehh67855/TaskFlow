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
        System.out.println(node);
        return nodeRepository.save(
            Node.builder()
            .color("#7FC6A4")
            .title("Add description")
            .label("New")
            .build()
        );
    }
    
    public void deleteNode(Long id) {
        nodeRepository.deleteById(id);
    }
    
}
