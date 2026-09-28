package com.backend.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class UserProgressDto {
    private int currentStreak;
    private int longestStreak;
    private List<BadgeDto> badges;
}
