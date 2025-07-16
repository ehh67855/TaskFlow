package com.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.entites.Edge;

@Repository
public interface EdgeRepository extends JpaRepository<Edge,Long>{
    void deleteByFromId(Long fromId);
    void deleteByToId(Long toId);
}
