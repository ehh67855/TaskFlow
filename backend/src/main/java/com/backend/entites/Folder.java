package com.backend.entites;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "folders")
public class Folder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @JsonBackReference("user-folder")
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Null means this is a top-level folder.
    @JsonBackReference("folder-parent")
    @ManyToOne
    @JoinColumn(name = "parent_folder_id")
    private Folder parent;

    @JsonManagedReference("folder-parent")
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Folder> subfolders = new ArrayList<>();

    @JsonManagedReference("folder-network")
    @OneToMany(mappedBy = "folder")
    @Builder.Default
    private List<Network> networks = new ArrayList<>();
}
