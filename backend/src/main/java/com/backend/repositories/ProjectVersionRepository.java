package com.backend.repositories;

import com.backend.entites.Project;
import com.backend.entites.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {
    List<ProjectVersion> findByProjectOrderByIdDesc(Project project);
}
