package com.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entites.ActivationToken;
import com.backend.entites.User;


public interface ActivationTokenRepository extends JpaRepository<ActivationToken,Long> {
    ActivationToken findByToken(String token);
    ActivationToken findByUser(User user);
}
