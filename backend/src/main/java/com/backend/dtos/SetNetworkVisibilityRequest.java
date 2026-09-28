package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SetNetworkVisibilityRequest {
    private String id;
    private String login;
    private boolean visibleToFriends;
}
