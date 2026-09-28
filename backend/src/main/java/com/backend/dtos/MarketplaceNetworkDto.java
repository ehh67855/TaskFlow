package com.backend.dtos;

import java.time.LocalDateTime;
import java.util.List;

import com.backend.entites.Edge;
import com.backend.entites.Node;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// nodes/edges are included (not just a summary) so the marketplace grid can render the same
// MiniNetwork preview the home page uses for a user's own networks, straight from this DTO.
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class MarketplaceNetworkDto {
    private Long id;
    private String name;
    private String ownerLogin;
    private String ownerName;
    private LocalDateTime publishedAt;
    private List<Node> nodes;
    private List<Edge> edges;
}
