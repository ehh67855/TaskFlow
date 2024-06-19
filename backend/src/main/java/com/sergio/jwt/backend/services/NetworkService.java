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

    public List<Network> getUserNetworksByLogin(String login) {
        return userService.getUser(login).getNetworks();
    }

    public Network getNetwork(Long id) {
        return networkRepository.findById(id).orElseThrow(
            ()-> new AppException("Network not found", HttpStatus.NOT_FOUND));
    }

    public Network createNetwork(NetworkDto networkDto) {

        if (networkRepository.findByName(networkDto.name()).isPresent()) {
            throw new AppException("Network name is already in use", HttpStatus.CONFLICT);
        }

        Network network = new Network();
        network.setName(networkDto.name());


        //Assign user
        User user = userService.getUser(networkDto.login());
        network.setUser(user);
        List<Network> userNetworks = user.getNetworks();
        userNetworks.add(network);
        user.setNetworks(userNetworks);

        return networkRepository.save(network);
    }

    public void deleteNetwork(Long id) {
        networkRepository.deleteById(id);
    }
    
}
