package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Lightweight user info for anywhere another user is shown in a list - search results, a
// friend request's sender/receiver, a friends list row. relationshipStatus is only populated
// where it's meaningful (e.g. search results, viewing someone else's profile) - see its own
// javadoc.
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserSummaryDto {

    private String login;
    private String firstName;
    private String lastName;
    private String profilePicture;

    // How the *viewing* user relates to this one: "SELF", "FRIENDS", "REQUEST_SENT" (viewer
    // already sent this person a pending request), "REQUEST_RECEIVED" (this person sent the
    // viewer a pending request), or "NONE". Null when the endpoint isn't viewer-relative (e.g.
    // a friend request's own sender/receiver summary).
    private String relationshipStatus;
}
