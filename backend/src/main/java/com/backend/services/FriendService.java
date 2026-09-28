package com.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.dtos.FriendRequestDto;
import com.backend.dtos.UserProfileDto;
import com.backend.dtos.UserSummaryDto;
import com.backend.entites.FriendRequest;
import com.backend.entites.User;
import com.backend.enums.FriendRequestStatus;
import com.backend.exceptions.AppException;
import com.backend.mappers.UserMapper;
import com.backend.repositories.FriendRequestRepository;
import com.backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserMapper userMapper;

    @Transactional
    public FriendRequestDto sendRequest(String senderLogin, String receiverLogin) {
        if (senderLogin.equalsIgnoreCase(receiverLogin)) {
            throw new AppException("You can't send yourself a friend request", HttpStatus.BAD_REQUEST);
        }

        User sender = userService.getUser(senderLogin);
        User receiver = userService.getUser(receiverLogin);

        Optional<FriendRequest> existing = friendRequestRepository.findBetween(sender, receiver);
        if (existing.isPresent()) {
            FriendRequest request = existing.get();
            if (request.getStatus() == FriendRequestStatus.ACCEPTED) {
                throw new AppException("You're already friends", HttpStatus.CONFLICT);
            }
            if (request.getStatus() == FriendRequestStatus.PENDING) {
                throw new AppException("A friend request is already pending between you two", HttpStatus.CONFLICT);
            }
            // DECLINED - re-sending re-opens the same row (whichever direction) rather than
            // insisting on a brand new one, so the pair only ever has a single history.
            request.setSender(sender);
            request.setReceiver(receiver);
            request.setStatus(FriendRequestStatus.PENDING);
            request.setRespondedAt(null);
            return toDto(friendRequestRepository.save(request));
        }

        FriendRequest request = FriendRequest.builder()
            .sender(sender)
            .receiver(receiver)
            .status(FriendRequestStatus.PENDING)
            .build();
        return toDto(friendRequestRepository.save(request));
    }

    @Transactional
    public FriendRequestDto respondToRequest(Long requestId, String receiverLogin, boolean accept) {
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException("Friend request not found", HttpStatus.NOT_FOUND));

        if (!request.getReceiver().getLogin().equals(receiverLogin)) {
            throw new AppException("Friend request not found", HttpStatus.NOT_FOUND);
        }
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new AppException("This request has already been responded to", HttpStatus.CONFLICT);
        }

        request.setStatus(accept ? FriendRequestStatus.ACCEPTED : FriendRequestStatus.DECLINED);
        request.setRespondedAt(LocalDateTime.now());
        return toDto(friendRequestRepository.save(request));
    }

    @Transactional
    public void cancelRequest(Long requestId, String senderLogin) {
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException("Friend request not found", HttpStatus.NOT_FOUND));

        if (!request.getSender().getLogin().equals(senderLogin) || request.getStatus() != FriendRequestStatus.PENDING) {
            throw new AppException("Friend request not found", HttpStatus.NOT_FOUND);
        }
        friendRequestRepository.delete(request);
    }

    @Transactional
    public void removeFriend(String login, String friendLogin) {
        User user = userService.getUser(login);
        User friend = userService.getUser(friendLogin);

        FriendRequest friendship = friendRequestRepository.findBetween(user, friend)
            .filter(fr -> fr.getStatus() == FriendRequestStatus.ACCEPTED)
            .orElseThrow(() -> new AppException("You're not friends with this user", HttpStatus.NOT_FOUND));
        friendRequestRepository.delete(friendship);
    }

    // Used by NetworkService to decide whether someone is allowed to see/clone a network that's
    // marked visible-to-friends but not published to the public marketplace.
    public boolean areFriends(String loginA, String loginB) {
        User a = userService.getUser(loginA);
        User b = userService.getUser(loginB);
        return friendRequestRepository.findBetween(a, b)
            .map(fr -> fr.getStatus() == FriendRequestStatus.ACCEPTED)
            .orElse(false);
    }

    public List<UserSummaryDto> getFriends(String login) {
        User user = userService.getUser(login);
        return friendRequestRepository.findFriendships(user).stream()
            .map(fr -> otherUser(fr, user))
            .map(u -> userMapper.toUserSummaryDto(u, "FRIENDS"))
            .collect(Collectors.toList());
    }

    public List<FriendRequestDto> getIncomingRequests(String login) {
        User user = userService.getUser(login);
        return friendRequestRepository.findByReceiverAndStatus(user, FriendRequestStatus.PENDING).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<FriendRequestDto> getOutgoingRequests(String login) {
        User user = userService.getUser(login);
        return friendRequestRepository.findBySenderAndStatus(user, FriendRequestStatus.PENDING).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<UserSummaryDto> searchUsers(String viewerLogin, String query) {
        User viewer = userService.getUser(viewerLogin);
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return userRepository.search(query.trim(), viewerLogin).stream()
            .map(u -> userMapper.toUserSummaryDto(u, relationshipStatus(viewer, u)))
            .collect(Collectors.toList());
    }

    public UserProfileDto getProfile(String viewerLogin, String targetLogin) {
        User viewer = userService.getUser(viewerLogin);
        User target = userService.getUser(targetLogin);
        int friendCount = friendRequestRepository.findFriendships(target).size();

        return UserProfileDto.builder()
            .login(target.getLogin())
            .firstName(target.getFirstName())
            .lastName(target.getLastName())
            .bio(target.getBio())
            .profilePicture(target.getProfilePicture())
            .friendCount(friendCount)
            .relationshipStatus(relationshipStatus(viewer, target))
            .build();
    }

    private User otherUser(FriendRequest fr, User user) {
        return fr.getSender().getLogin().equals(user.getLogin()) ? fr.getReceiver() : fr.getSender();
    }

    private String relationshipStatus(User viewer, User target) {
        if (viewer.getLogin().equals(target.getLogin())) {
            return "SELF";
        }
        Optional<FriendRequest> existing = friendRequestRepository.findBetween(viewer, target);
        if (existing.isEmpty()) {
            return "NONE";
        }
        FriendRequest request = existing.get();
        if (request.getStatus() == FriendRequestStatus.ACCEPTED) {
            return "FRIENDS";
        }
        if (request.getStatus() == FriendRequestStatus.PENDING) {
            return request.getSender().getLogin().equals(viewer.getLogin()) ? "REQUEST_SENT" : "REQUEST_RECEIVED";
        }
        return "NONE";
    }

    private FriendRequestDto toDto(FriendRequest request) {
        return FriendRequestDto.builder()
            .id(request.getId())
            .sender(userMapper.toUserSummaryDto(request.getSender(), null))
            .receiver(userMapper.toUserSummaryDto(request.getReceiver(), null))
            .status(request.getStatus().name())
            .createdAt(request.getCreatedAt())
            .build();
    }
}
