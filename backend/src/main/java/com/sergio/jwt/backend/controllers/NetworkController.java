package com.sergio.jwt.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.services.NetworkService;

import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkService networkService; 

    @GetMapping("/getUserNetworksByLogin/{login}")
    public ResponseEntity<List<Network>> getUserNetworksByLogin(@PathVariable String login) {
        return ResponseEntity.ok(networkService.getUserNetworksByLogin(login));
    }

    @PostMapping("/create-network")
    public ResponseEntity<Network> createNetwork(@RequestBody @Valid NetworkDto network) {
        return ResponseEntity.ok(networkService.createNetwork(network));
    }
    
}
