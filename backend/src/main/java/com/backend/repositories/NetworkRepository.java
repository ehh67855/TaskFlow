package com.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.backend.entites.Folder;
import com.backend.entites.Network;
import com.backend.entites.User;

public interface NetworkRepository extends JpaRepository<Network, Long> {
    Optional<Network> findByName(String name);
    Optional<Network> findByIdAndUserLogin(Long networkId, String login);
    Optional<Network> findByNameAndUser(String name, User user);
    Optional<Network> findByNameAndUserAndFolder(String name, User user, Folder folder);
    List<Network> findByPublishedTrueOrderByPublishedAtDesc();
    List<Network> findByPublishedTrueAndNameContainingIgnoreCaseOrderByPublishedAtDesc(String name);

    // Written as an explicit JPQL query (rather than a derived `findByUserLoginInAndVisibleToFriendsTrue...`
    // method name) to sidestep Spring Data's ambiguity around boolean properties in derived
    // query names - safer than relying on the parser guessing `visibleToFriends` correctly.
    @Query("SELECT n FROM Network n WHERE n.user.login IN :logins AND n.visibleToFriends = true ORDER BY n.id DESC")
    List<Network> findFriendsNetworks(@Param("logins") List<String> logins);
}
