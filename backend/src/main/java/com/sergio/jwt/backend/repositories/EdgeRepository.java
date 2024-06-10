package com.sergio.jwt.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sergio.jwt.backend.entites.Edge;

@Repository
public interface EdgeRepository extends JpaRepository<Edge,Long>{
    
}
