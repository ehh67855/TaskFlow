package com.sergio.jwt.backend.dtos;

import java.util.List;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutineDto {
    private Long networkId;
    private Long id;
    private int totalMinutes;
    private List<RoutineItemDto> routineItems;
    private String login;
}
