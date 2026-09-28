package com.backend.dtos;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FriendRequestDto {

    private Long id;
    private UserSummaryDto sender;
    private UserSummaryDto receiver;
    private String status;
    private LocalDateTime createdAt;
}
