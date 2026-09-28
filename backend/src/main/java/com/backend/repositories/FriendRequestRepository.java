package com.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.entites.FriendRequest;
import com.backend.entites.User;
import com.backend.enums.FriendRequestStatus;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // Regardless of who sent it - used to block duplicate/crossed requests and to look up the
    // existing relationship (if any) between two users.
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "(fr.sender = :a AND fr.receiver = :b) OR (fr.sender = :b AND fr.receiver = :a)")
    Optional<FriendRequest> findBetween(@Param("a") User a, @Param("b") User b);

    List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequestStatus status);

    List<FriendRequest> findBySenderAndStatus(User sender, FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.status = com.backend.enums.FriendRequestStatus.ACCEPTED " +
           "AND (fr.sender = :user OR fr.receiver = :user)")
    List<FriendRequest> findFriendships(@Param("user") User user);
}
