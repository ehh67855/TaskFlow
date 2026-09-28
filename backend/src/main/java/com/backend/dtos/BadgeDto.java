package com.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class BadgeDto {
    private String id;
    private String name;
    private String description;
    // A single emoji - simplest way to render an icon without shipping/managing image assets.
    private String icon;
    private boolean unlocked;
    // current is capped at target - it's "progress toward this badge", not a raw lifetime
    // stat (that's what current/target being equal at 100% would misleadingly overstate).
    private int current;
    private int target;
}
