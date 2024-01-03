package com.TaskFlow.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor @NoArgsConstructor @Getter @Setter @ToString
public class UserRegistrationDTO {
    private String username;
    private String password;
    private String confirmPassword;
}
