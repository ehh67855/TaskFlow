package com.backend.dtos;

import com.backend.entites.Edge;
import com.backend.entites.Node;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class SaveNodeResponse {
    private Node node;
    // Only set when the node was just created as a child of another node.
    private Edge edge;
}
