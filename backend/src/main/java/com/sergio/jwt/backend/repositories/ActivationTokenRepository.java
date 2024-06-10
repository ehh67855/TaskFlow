package com.sergio.jwt.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sergio.jwt.backend.entites.ActivationToken;
import com.sergio.jwt.backend.entites.User;


public interface ActivationTokenRepository extends JpaRepository<ActivationToken,Long> {
    ActivationToken findByToken(String token);
    ActivationToken findByUser(User user);
}
