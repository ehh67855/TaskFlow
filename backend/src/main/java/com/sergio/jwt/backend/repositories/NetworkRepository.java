package com.sergio.jwt.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.entites.User;

public interface NetworkRepository extends JpaRepository<Network, Long> {
    Optional<Network> findByName(String name);
    Optional<Network> findByIdAndUserLogin(Long networkId, String login);
    Optional<Network> findByNameAndUser(String name, User user);
}
