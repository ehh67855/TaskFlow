package com.backend.repositories;

import com.backend.entites.Project;
import com.backend.entites.ProjectVersion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerId(Long ownerId);
    List<Project> findByOwnerLogin(String login);
}
