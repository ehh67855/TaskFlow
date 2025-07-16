package com.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.entites.Routine;

@Repository
public interface RoutineRepository extends JpaRepository<Routine,Long>{
    
}
