package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class SaveNodeRequest {
    // Blank/null means create a new node; otherwise updates the existing node with this id.
    private String id;
    // Only meaningful when creating - links the new node to its parent with an edge, in the
    // same request, so a node is never created without immediately being placed in the graph.
    private String parentNodeId;
    private String title;
    private String label;
    private String color;
    private String priority;
    private String difficulty;
    private String estimatedMinutes;
    private String estimatedSeconds;
    private String isAreaOfFocus;
    private String description;
    private String quantifierLabel;
    private String networkId;
}
