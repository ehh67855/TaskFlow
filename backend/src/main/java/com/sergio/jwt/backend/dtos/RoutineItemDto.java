package com.sergio.jwt.backend.dtos;

import java.time.Duration;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RoutineItemDto {
    private Long id;
    private Long nodeId;
    private Duration amountOfTime;
    private double targetValue;
    private double achievedValue;
}
