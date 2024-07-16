package com.sergio.jwt.backend.dtos;

import java.util.List;

import com.sergio.jwt.backend.entites.RoutineItem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoutineDto {
    private String networkId;
    private String login;
    private String minutes;
    private List<RoutineItem> routineItems;
}