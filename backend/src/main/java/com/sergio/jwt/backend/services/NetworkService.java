package com.sergio.jwt.backend.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.entites.Edge;
import com.sergio.jwt.backend.entites.Node;
import com.sergio.jwt.backend.entites.User;
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
    private final EdgeRepository edgeRepository;
    private final NodeRepository nodeRepository;
    private final UserService userService;

    public List<Network> getUserNetworksByLogin(String login) {
        return userService.getUser(login).getNetworks();
    }

    public Network createNetwork(NetworkDto networkDto) {

        User user = userService.getUser(networkDto.login());
        Network network = new Network();
        network.setName(networkDto.name());
        network.setUser(user);
    
        List<Network> userNetworks = user.getNetworks();
        userNetworks.add(network);
        user.setNetworks(userNetworks);
    
        // Save the network first to generate the ID
        Network savedNetwork = networkRepository.save(network);
    
        Node node = new Node();
        node.setLabel("Root");
        node.setNetwork(savedNetwork);
    
        // Save the node with the network ID
        nodeRepository.save(node);
    
        Set<Node> nodes = savedNetwork.getNodes();
        nodes.add(node);
        savedNetwork.setNodes(nodes);
    
        return savedNetwork;
    }
    
}
