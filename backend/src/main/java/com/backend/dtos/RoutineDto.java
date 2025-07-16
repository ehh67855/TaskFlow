package com.backend.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutineDto {
    private String login;
    private String id;
    private String networkId;
    private String totalMinutes;
    private List<RoutineItemDto> routineItems;
}
