package com.backend.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dtos.FriendRequestDto;
import com.backend.dtos.SendFriendRequestDto;
import com.backend.dtos.UserSummaryDto;
import com.backend.services.FriendService;

import lombok.RequiredArgsConstructor;

// All mutations are POST (not DELETE/PUT) - the app's CORS config only allows GET/POST/OPTIONS
// (see SecurityConfig.corsConfigurationSource), matching how delete-node/delete-edge etc. in
// NetworkController work too.
@RequiredArgsConstructor
@RestController
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/friend-requests")
    public ResponseEntity<FriendRequestDto> sendRequest(@RequestBody SendFriendRequestDto request) {
        return ResponseEntity.ok(friendService.sendRequest(request.getSenderLogin(), request.getReceiverLogin()));
    }

    @PostMapping("/friend-requests/{id}/accept")
    public ResponseEntity<FriendRequestDto> acceptRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(friendService.respondToRequest(id, body.get("login"), true));
    }

    @PostMapping("/friend-requests/{id}/decline")
    public ResponseEntity<FriendRequestDto> declineRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(friendService.respondToRequest(id, body.get("login"), false));
    }

    @PostMapping("/friend-requests/{id}/cancel")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        friendService.cancelRequest(id, body.get("login"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/remove-friend")
    public ResponseEntity<Void> removeFriend(@RequestBody Map<String, String> body) {
        friendService.removeFriend(body.get("login"), body.get("friendLogin"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/friends/{login}")
    public ResponseEntity<List<UserSummaryDto>> getFriends(@PathVariable String login) {
        return ResponseEntity.ok(friendService.getFriends(login));
    }

    @GetMapping("/friend-requests/incoming/{login}")
    public ResponseEntity<List<FriendRequestDto>> getIncomingRequests(@PathVariable String login) {
        return ResponseEntity.ok(friendService.getIncomingRequests(login));
    }

    @GetMapping("/friend-requests/outgoing/{login}")
    public ResponseEntity<List<FriendRequestDto>> getOutgoingRequests(@PathVariable String login) {
        return ResponseEntity.ok(friendService.getOutgoingRequests(login));
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserSummaryDto>> searchUsers(
        @RequestParam String login,
        @RequestParam String query
    ) {
        return ResponseEntity.ok(friendService.searchUsers(login, query));
    }
}
