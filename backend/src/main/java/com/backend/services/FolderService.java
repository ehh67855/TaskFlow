package com.backend.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.backend.dtos.CreateFolderRequest;
import com.backend.dtos.FolderDto;
import com.backend.dtos.MoveFolderRequest;
import com.backend.dtos.RenameFolderRequest;
import com.backend.entites.Folder;
import com.backend.entites.User;
import com.backend.exceptions.AppException;
import com.backend.repositories.FolderRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserService userService;

    public List<FolderDto> getUserFolders(String login) {
        return folderRepository.findByUserLogin(login).stream()
            .map(this::mapFolder)
            .collect(Collectors.toList());
    }

    public FolderDto createFolder(CreateFolderRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException("Folder name is required", HttpStatus.BAD_REQUEST);
        }

        User user = userService.getUser(request.getLogin());
        Folder parent = resolveOwnedFolder(request.getParentFolderId(), request.getLogin());

        assertNameAvailable(request.getName(), user, parent, null);

        Folder folder = Folder.builder()
            .name(request.getName())
            .user(user)
            .parent(parent)
            .build();
        Folder saved = folderRepository.save(folder);
        return mapFolder(saved);
    }

    public FolderDto renameFolder(RenameFolderRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new AppException("Folder name is required", HttpStatus.BAD_REQUEST);
        }

        Folder folder = findOwnedFolder(request.getId(), request.getLogin());
        assertNameAvailable(request.getName(), folder.getUser(), folder.getParent(), folder.getId());

        folder.setName(request.getName());
        Folder saved = folderRepository.save(folder);
        return mapFolder(saved);
    }

    public void deleteFolder(Long id, String login) {
        Folder folder = findOwnedFolder(String.valueOf(id), login);
        if (!folder.getSubfolders().isEmpty() || !folder.getNetworks().isEmpty()) {
            throw new AppException("Folder must be empty before it can be deleted", HttpStatus.BAD_REQUEST);
        }
        folderRepository.delete(folder);
    }

    public FolderDto moveFolder(MoveFolderRequest request) {
        Folder folder = findOwnedFolder(request.getId(), request.getLogin());
        Folder newParent = resolveOwnedFolder(request.getParentFolderId(), request.getLogin());

        if (newParent != null) {
            assertNoCycle(folder, newParent);
        }
        assertNameAvailable(folder.getName(), folder.getUser(), newParent, folder.getId());

        folder.setParent(newParent);
        Folder saved = folderRepository.save(folder);
        return mapFolder(saved);
    }

    private void assertNoCycle(Folder folderBeingMoved, Folder newParent) {
        Folder cursor = newParent;
        while (cursor != null) {
            if (cursor.getId().equals(folderBeingMoved.getId())) {
                throw new AppException("Cannot move a folder into itself or one of its own subfolders", HttpStatus.BAD_REQUEST);
            }
            cursor = cursor.getParent();
        }
    }

    private void assertNameAvailable(String name, User user, Folder parent, Long excludingFolderId) {
        folderRepository.findByNameAndUserAndParent(name, user, parent).ifPresent(existing -> {
            if (excludingFolderId == null || !existing.getId().equals(excludingFolderId)) {
                throw new AppException("A folder with that name already exists here", HttpStatus.CONFLICT);
            }
        });
    }

    // Null/blank folderId means "top level" (no parent folder).
    private Folder resolveOwnedFolder(String folderId, String login) {
        if (folderId == null || folderId.isBlank()) {
            return null;
        }
        return findOwnedFolder(folderId, login);
    }

    private Folder findOwnedFolder(String folderId, String login) {
        return folderRepository.findByIdAndUserLogin(Long.valueOf(folderId), login)
            .orElseThrow(() -> new AppException("Folder not found", HttpStatus.NOT_FOUND));
    }

    private FolderDto mapFolder(Folder folder) {
        Long parentId = folder.getParent() != null ? folder.getParent().getId() : null;
        return new FolderDto(folder.getId(), folder.getName(), parentId);
    }
}
