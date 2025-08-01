package com.backend.services;

import com.backend.dtos.CredentialsDto;
import com.backend.dtos.EdgeDto;
import com.backend.dtos.SignUpDto;
import com.backend.dtos.UserDto;
import com.backend.entites.ActivationToken;
import com.backend.entites.Edge;
import com.backend.entites.User;
import com.backend.enums.Role;
import com.backend.exceptions.AppException;
import com.backend.mappers.UserMapper;
import com.backend.repositories.ActivationTokenRepository;
import com.backend.repositories.UserRepository;

import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.CharBuffer;
import java.time.LocalDateTime;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    private final ActivationTokenRepository activationTokenRepository;

    private final EmailService emailService;

    public UserDto login(CredentialsDto credentialsDto) {
        User user = userRepository.findByLogin(credentialsDto.getLogin())
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));

        if(!user.isActive()) {
            throw new AppException("User account not active", HttpStatus.FORBIDDEN);
        }


        if (passwordEncoder.matches(CharBuffer.wrap(credentialsDto.getPassword()), user.getPassword())) {
            return userMapper.toUserDto(user);
        }
        throw new AppException("Invalid password", HttpStatus.BAD_REQUEST);
    }

    public UserDto register(SignUpDto userDto) {
        Optional<User> optionalUser = userRepository.findByLogin(userDto.getLogin());

        if (optionalUser.isPresent()) {
            throw new AppException("Login already exists", HttpStatus.BAD_REQUEST);
        }

        User user = userMapper.signUpToUser(userDto);
        user.setRole(Role.USER);
        user.setPassword(passwordEncoder.encode(CharBuffer.wrap(userDto.getPassword())));
        user.setActive(false);


        User savedUser = userRepository.save(user);

        return userMapper.toUserDto(savedUser);
    }

    public UserDto findByLogin(String login) {
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));
        return userMapper.toUserDto(user);
    }

    public User getUser(String login) {
        return userRepository.findByLogin(login)
                .orElseThrow(() -> new AppException("Unknown user", HttpStatus.NOT_FOUND));
    }

    public boolean activateAccount(String token) {
        ActivationToken activationToken = activationTokenRepository.findByToken(token);
        if (activationToken != null && !activationToken.isExpired()) {
            User user = activationToken.getUser();
            user.setActive(true);
            userRepository.save(user);
            activationTokenRepository.delete(activationToken); 
            return true;
        }
        return false;
    }

    public void sendActivationEmail(String email, String token) {
        String activationLink = "http://localhost:4200/activate-account";
        emailService.sendSimpleMessage(email, "Activate Your Account", "Please click on the following link to activate your account: " + activationLink + ".\n Use the following activation token: " + token);
    }

    
    public void createActivationToken(User user, String token) {
        ActivationToken newToken = new ActivationToken();
        newToken.setUser(user);
        newToken.setToken(token);
        newToken.setExpiryDate(LocalDateTime.now().plusDays(1)); // Expires in 1 day
        activationTokenRepository.save(newToken);
    }
    
    public UserDto editProfile(SignUpDto userDto) {
        User updatedUser = getUser(userDto.getLogin());
    
        if (userDto.getFirstName() != null && !userDto.getFirstName().isEmpty()) {
            updatedUser.setFirstName(userDto.getFirstName());
        }
    
        if (userDto.getLastName() != null && !userDto.getLastName().isEmpty()) {
            updatedUser.setLastName(userDto.getLastName());
        }
    
        if (userDto.getPassword() != null && userDto.getPassword().length > 0
            && userDto.getConfirmPassword() != null && !userDto.getConfirmPassword().isEmpty()) {
            String newPassword = new String(userDto.getPassword());
            String confirmPassword = userDto.getConfirmPassword();
    
            // Check if the confirm password (current password) matches the stored password
            if (!passwordEncoder.matches(confirmPassword, updatedUser.getPassword())) {
                throw new AppException("Inputted password did not match stored password", HttpStatus.FORBIDDEN);
            }
    
            // Check if the new password is different from the old password
            if (passwordEncoder.matches(newPassword, updatedUser.getPassword())) {
                throw new AppException("New password cannot be equal to old password", HttpStatus.CONFLICT);
            }
    
            // Update the password
            updatedUser.setPassword(passwordEncoder.encode(newPassword));
        }
    
        User savedUser = userRepository.save(updatedUser);
        return userMapper.toUserDto(savedUser);
    }

    
}
