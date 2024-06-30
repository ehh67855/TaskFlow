package com.sergio.jwt.backend.dtos;

import lombok.Builder;

@Builder
public record NodeDto(String networkId, String id, String label, String title, String color) {
}
