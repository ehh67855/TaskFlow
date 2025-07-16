package com.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.entites.Node;

@Repository
public interface NodeRepository extends JpaRepository<Node,Long>{
    
}
