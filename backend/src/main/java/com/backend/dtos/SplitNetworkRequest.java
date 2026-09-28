package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class SplitNetworkRequest {
    // Must be a category node - it (and its full descendant subtree) is what gets extracted
    // into the new network, becoming that network's Root Node.
    private String nodeId;
    // Blank/null defaults to the node's own title, same "sensible default, user can override"
    // convention as elsewhere (e.g. paste keeping the copied node's own fields).
    private String newNetworkName;
    private String login;
    // Null/blank means the new network lands at the top level.
    private String folderId;
}
