package com.sergio.jwt.backend.dtos;

import java.util.List;

public record NetworkDto(
    String login, 
    String name, 
    String quantifier,
    List<NodeDto> nodes,
    List<EdgeDto> edges) {}
