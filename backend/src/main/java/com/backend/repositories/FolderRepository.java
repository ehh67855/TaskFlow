package com.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entites.Folder;
import com.backend.entites.User;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    Optional<Folder> findByIdAndUserLogin(Long folderId, String login);
    Optional<Folder> findByNameAndUserAndParent(String name, User user, Folder parent);
    List<Folder> findByUserLogin(String login);
}
