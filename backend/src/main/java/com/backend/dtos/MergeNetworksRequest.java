package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class MergeNetworksRequest {
    // The network being merged INTO - stays around afterward, with the merged content added.
    private String targetNetworkId;
    // The network being absorbed - its root becomes a category node inside the target, and
    // the source network itself is deleted once the merge succeeds.
    private String sourceNetworkId;
    private String login;
}
