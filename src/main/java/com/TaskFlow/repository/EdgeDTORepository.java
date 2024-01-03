package com.TaskFlow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.TaskFlow.domain.EdgeDTO;

@Repository
public interface EdgeDTORepository extends JpaRepository<EdgeDTO,Long> {
    
}
