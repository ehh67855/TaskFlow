package com.sergio.jwt.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sergio.jwt.backend.entites.Network;

public interface NetworkRepository extends JpaRepository<Network, Long> {
}
