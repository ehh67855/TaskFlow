package com.backend.entites;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@Entity
@Table(name = "project_version")
public class ProjectVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Lob
    @Column(columnDefinition = "LONGBLOB", nullable = false)
    @JsonIgnore
    private byte[] blobData;

    // Add ManyToOne relationship
    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;  // This creates the projectId column in project_version table
}
