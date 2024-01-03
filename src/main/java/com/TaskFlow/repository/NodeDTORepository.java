package com.TaskFlow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.TaskFlow.domain.NodeDTO;

@Repository
public interface NodeDTORepository extends JpaRepository<NodeDTO,Long> {
        void deleteNodeDTOById(int id);
}
