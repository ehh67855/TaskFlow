package com.sergio.jwt.backend.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutineDTO {
    private String login;
    private String id;
    private String networkId;
    private String totalMinutes;
    private List<RoutineItemDTO> routineItems;
}