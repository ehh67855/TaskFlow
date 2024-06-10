package com.sergio.jwt.backend.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.repositories.NetworkRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NetworkService {

    private final UserService userService;
    private final NetworkRepository networkRepository;
    
    public List<Network> getUserNetworksByLogin(String login) {
        return userService.getUser(login).getNetworks();
    }

    public Network createNetwork(NetworkDto network) {
        return networkRepository.save(
            Network.builder()
            .name(network.name())
            .quantifier(network.quantifier())
            .user(userService.getUser(network.login()))
            .build()
        );
    }
}
