package com.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.dtos.CreateFolderRequest;
import com.backend.dtos.FolderDto;
import com.backend.dtos.MoveFolderRequest;
import com.backend.dtos.RenameFolderRequest;
import com.backend.services.FolderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @GetMapping("/getUserFoldersByLogin/{login}")
    public ResponseEntity<List<FolderDto>> getUserFoldersByLogin(@PathVariable String login) {
        return ResponseEntity.ok(folderService.getUserFolders(login));
    }

    @PostMapping("/create-folder")
    public ResponseEntity<FolderDto> createFolder(@RequestBody CreateFolderRequest request) {
        return ResponseEntity.ok(folderService.createFolder(request));
    }

    @PostMapping("/rename-folder")
    public ResponseEntity<FolderDto> renameFolder(@RequestBody RenameFolderRequest request) {
        return ResponseEntity.ok(folderService.renameFolder(request));
    }

    @PostMapping("/move-folder")
    public ResponseEntity<FolderDto> moveFolder(@RequestBody MoveFolderRequest request) {
        return ResponseEntity.ok(folderService.moveFolder(request));
    }

    @PostMapping("/delete-folder/{id}")
    public void deleteFolder(@PathVariable("id") Long id, @RequestParam("login") String login) {
        folderService.deleteFolder(id, login);
    }
}
