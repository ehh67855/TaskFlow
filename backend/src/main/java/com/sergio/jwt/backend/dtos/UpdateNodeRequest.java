package com.sergio.jwt.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class UpdateNodeRequest {
    private String id;
    private String title;
    private String priority;
    private String difficulty;
    private String estimatedTime;
    private String networkId;
}
