package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class MoveNetworkRequest {
    private String id;
    private String login;
    // Null/blank means move to the top level (no folder).
    private String folderId;
}
