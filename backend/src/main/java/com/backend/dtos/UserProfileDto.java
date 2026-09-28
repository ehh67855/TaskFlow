package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileDto {

    private String login;
    private String firstName;
    private String lastName;
    private String bio;
    private String profilePicture;
    private int friendCount;

    // How the viewer relates to this profile - "SELF", "FRIENDS", "REQUEST_SENT",
    // "REQUEST_RECEIVED", or "NONE". See UserSummaryDto for the same convention.
    private String relationshipStatus;
}
