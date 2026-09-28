package com.backend.mappers;

import com.backend.dtos.SignUpDto;
import com.backend.dtos.UserDto;
import com.backend.dtos.UserSummaryDto;
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
                .profilePicture(user.getProfilePicture())
                .bio(user.getBio())
                .build();
    }

    // relationshipStatus is caller-supplied (see UserSummaryDto's javadoc) since it's relative
    // to whoever's viewing, not a property of `user` itself.
    public UserSummaryDto toUserSummaryDto(User user, String relationshipStatus) {
        if (user == null) {
            return null;
        }

        return UserSummaryDto.builder()
                .login(user.getLogin())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePicture(user.getProfilePicture())
                .relationshipStatus(relationshipStatus)
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