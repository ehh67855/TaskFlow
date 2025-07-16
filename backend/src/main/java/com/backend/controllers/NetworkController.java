package com.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.backend.config.UserAuthenticationProvider;
import com.backend.dtos.AddChildRequest;
import com.backend.dtos.EdgeDto;
import com.backend.dtos.NetworkDto;
import com.backend.dtos.NodeDto;
import com.backend.dtos.RoutineDto;
import com.backend.dtos.RoutineItemDto;
import com.backend.dtos.UpdateNodeRequest;
import com.backend.dtos.UserDto;
import com.backend.entites.Edge;
import com.backend.entites.Network;
import com.backend.entites.Node;
import com.backend.entites.Routine;
import com.backend.services.NetworkService;
import com.backend.services.UserService;

import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;


@RestController
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkService networkService; 
    private final UserService userService;

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
    public ResponseEntity<Network> getNetwork(@PathVariable("id") Long id, @RequestParam("login") String login, Authentication authentication) {
        return ResponseEntity.ok(networkService.getNetwork(id, login));
    }


    @PostMapping("/create-node")
    public ResponseEntity<Node> createNode(@RequestBody @Valid NodeDto node) {
        return ResponseEntity.ok(networkService.createNode(node));
    }

    @PostMapping("/delete-node")
    public ResponseEntity<String> deleteNode(@RequestBody @Valid NodeDto node) {
        networkService.deleteNode(Long.valueOf(node.getId()));
        return ResponseEntity.ok("Node Successfully deleted");
    }

    @PostMapping("/create-edge")
    public ResponseEntity<Edge> createEdge(@RequestBody @Valid EdgeDto edge) {
        return ResponseEntity.ok(networkService.createEdge(edge));
    }

    @PostMapping("/delete-edge")
    public ResponseEntity<String> deleteEdge(@RequestBody @Valid EdgeDto edge) {
        networkService.deleteEdge(edge);
        return ResponseEntity.ok("Edge successfully deleted");
    }

    @PostMapping("/edit-edge")
    public ResponseEntity<Edge> editEdge(@RequestBody @Valid EdgeDto edge) {
        return ResponseEntity.ok(networkService.editEdge(edge));
    }
    
    @PostMapping("/edit-node")
    public ResponseEntity<Node> editNode(@RequestBody @Valid NodeDto node) {
        return ResponseEntity.ok(networkService.editNode(node));
    }

    @PostMapping("/add-child")
    public ResponseEntity<Edge> addChild(@RequestBody @Valid AddChildRequest addChildRequest) {
        return ResponseEntity.ok(networkService.addChild(addChildRequest));
    }

    @PostMapping("/update-node")
    public ResponseEntity<Node> updateNode(@RequestBody @Valid UpdateNodeRequest updateNodeRequest) {
        return ResponseEntity.ok(networkService.updateNode(updateNodeRequest));
    }

    @PostMapping("/create-routine")
    public ResponseEntity<Routine> createRoutine(@RequestBody RoutineDto routine) {
        // return ResponseEntity.ok(networkService.createRoutine(routine));
        return ResponseEntity.ok(networkService.createRoutine(routine));
    }

    @PostMapping("/save-routine")
    public ResponseEntity<RoutineDto> saveRoutine(@RequestBody RoutineDto routine) {
        return ResponseEntity.ok(networkService.saveRoutine(routine));
    }
}
