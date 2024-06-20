package com.sergio.jwt.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.sergio.jwt.backend.dtos.EdgeDto;
import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.dtos.NodeDto;
import com.sergio.jwt.backend.entites.Edge;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.entites.Node;
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

    @PostMapping("/delete-network/{id}")
    public void deleteNetwork(@PathVariable("id") Long networkId) {
        networkService.deleteNetwork(networkId);
    }

    @GetMapping("/get-network/{id}")
    public ResponseEntity<Network> getNetwork(@PathVariable("id") Long id) {
        return ResponseEntity.ok(networkService.getNetwork(id));
    }

    @PostMapping("/create-node")
    public ResponseEntity<Node> createEdge(@RequestBody @Valid NodeDto node) {
        return ResponseEntity.ok(networkService.createNode(node));
    }

    @PostMapping("/delete-node")
    public ResponseEntity<String> deleteNode(@RequestBody @Valid NodeDto node) {
        networkService.deleteNode(Long.valueOf(node.id()));
        return ResponseEntity.ok("Node Successfully deleted");
    }
    

}
