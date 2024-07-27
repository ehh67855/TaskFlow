package com.sergio.jwt.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutineItemDto {
    private String id;
    private String targetValue;
    private String amountOfTime; // in milliseconds
}