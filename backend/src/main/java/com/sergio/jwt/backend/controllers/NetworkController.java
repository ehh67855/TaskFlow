package com.sergio.jwt.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sergio.jwt.backend.dtos.UserDto;
import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.services.UserService;

import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class NetworkController {

    private final UserService userService;

    @GetMapping("/getUserNetworksByLogin/{login}")
    public ResponseEntity<List<Network>> getUserNetworksByLogin(@PathVariable String login) {
        System.out.println("hello");    
        return ResponseEntity.ok(userService.getUser(login).getNetworks());
    }
    
}
