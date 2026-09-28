package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class CloneNetworkRequest {
    private String networkId;
    // The user adding this marketplace network to their own collection - not necessarily
    // (and usually isn't) the original owner.
    private String login;
    // Null/blank means the clone lands at the top level, same convention as everywhere else
    // a folder id is optional.
    private String folderId;
}
