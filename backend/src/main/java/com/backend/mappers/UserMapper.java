package com.backend.mappers;

import com.backend.dtos.SignUpDto;
import com.backend.dtos.UserDto;
import com.backend.entites.User;
import com.backend.enums.Role;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class UserMapper {

    public UserDto toUserDto(User user) {
        if (user == null) {
            return null;
        }

        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .login(user.getLogin())
                .role(user.getRole())
                .build();
    }

    public User signUpToUser(SignUpDto signUpDto) {
        if (signUpDto == null) {
            return null;
        }

        return User.builder()
                .firstName(signUpDto.getFirstName())
                .lastName(signUpDto.getLastName())
                .login(signUpDto.getLogin())
                .password(charArrayToString(signUpDto.getPassword()))
                .isActive(false)
                .networks(new ArrayList<>())
                .routines(new ArrayList<>())
                .role(Role.USER)
                .build();
    }

    public String charArrayToString(char[] password) {
        return password != null ? new String(password) : null;
    }
}