package com.backend.dtos;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponseDTO {
    private Long id;
    private String content;
    private String userLogin;
    private String firstName;
    private String lastName;
    private LocalDateTime createdAt;
}
