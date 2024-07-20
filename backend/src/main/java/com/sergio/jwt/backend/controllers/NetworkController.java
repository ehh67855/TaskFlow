package com.sergio.jwt.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.sergio.jwt.backend.config.UserAuthenticationProvider;
import com.sergio.jwt.backend.dtos.AddChildRequest;
import com.sergio.jwt.backend.dtos.EdgeDto;
import com.sergio.jwt.backend.dtos.NetworkDto;
import com.sergio.jwt.backend.dtos.NodeDto;
import com.sergio.jwt.backend.dtos.RoutineDto;
import com.sergio.jwt.backend.dtos.RoutineItemDto;
import com.sergio.jwt.backend.dtos.UpdateNodeRequest;
import com.sergio.jwt.backend.dtos.UserDto;
import com.sergio.jwt.backend.entites.Edge;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.entites.Node;
import com.sergio.jwt.backend.entites.Routine;
import com.sergio.jwt.backend.services.NetworkService;
import com.sergio.jwt.backend.services.UserService;

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
    public ResponseEntity<Network> getNetwork(@PathVariable("id") Long id, Authentication authentication) {
        return ResponseEntity.ok(networkService.getNetwork(id));
    }


    @PostMapping("/create-node")
    public ResponseEntity<Node> createNode(@RequestBody @Valid NodeDto node) {
        return ResponseEntity.ok(networkService.createNode(node));
    }

    @PostMapping("/delete-node")
    public ResponseEntity<String> deleteNode(@RequestBody @Valid NodeDto node) {
        networkService.deleteNode(Long.valueOf(node.id()));
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
    public ResponseEntity<RoutineDto> createRoutine(@RequestBody RoutineDto routine) {
        // Simulate creating a routine
        RoutineItemDto item1 = RoutineItemDto.builder().id("1L").targetValue("10").amountOfTime("60000").build();
        RoutineItemDto item2 = RoutineItemDto.builder().id("2L").targetValue("20").amountOfTime("120000").build();
        RoutineItemDto item3 = RoutineItemDto.builder().id("3L").targetValue("30").amountOfTime("120000").build();

        RoutineDto createdRoutine = RoutineDto.builder()
                .id("routine123")
                .login(routine.getLogin())
                .networkId(routine.getNetworkId())
                .totalMinutes(routine.getTotalMinutes())
                .routineItems(List.of(item1, item2, item3))
                .build();

        return new ResponseEntity<>(createdRoutine, HttpStatus.OK);
    }
}
