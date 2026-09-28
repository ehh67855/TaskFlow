package com.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dtos.UserProfileDto;
import com.backend.dtos.UserProgressDto;
import com.backend.services.FriendService;
import com.backend.services.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FriendService friendService;

    @GetMapping("/getUserProgress/{login}")
    public ResponseEntity<UserProgressDto> getUserProgress(@PathVariable String login) {
        return ResponseEntity.ok(userService.getUserProgress(login));
    }

    // login is whoever is signed in and viewing the page - determines relationshipStatus in
    // the response (e.g. "SELF" when viewing your own profile).
    @GetMapping("/profile/{targetLogin}")
    public ResponseEntity<UserProfileDto> getProfile(
        @PathVariable String targetLogin,
        @RequestParam String login
    ) {
        return ResponseEntity.ok(friendService.getProfile(login, targetLogin));
    }
}
