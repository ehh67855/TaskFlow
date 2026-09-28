package com.backend.dtos;

import java.time.Duration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeDto {
    private String networkId;
    private String id;
    private String label;
    private String title;
    private String color;

    // Only populated (and only read) on the JSON-import path through createNetwork - every
    // other caller of this DTO (editNode's quick color-cycle, deleteNode, etc.) leaves these
    // null, which is fine since createNetwork is the only place that reads them.
    private String description;
    private Duration estimatedAmountOfTime;
    private int difficulty;
    private int priority;
    private boolean areaOfFocus;
    private String quantifierLabel;
}
