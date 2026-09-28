package com.backend.dtos;

import java.util.List;

public record NetworkDto(
    String login,
    String name,
    String folderId,
    List<NodeDto> nodes,
    List<EdgeDto> edges) {}
