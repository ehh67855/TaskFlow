package com.sergio.jwt.backend.controllers;

import com.sergio.jwt.backend.config.UserAuthenticationProvider;
import com.sergio.jwt.backend.dtos.CredentialsDto;
import com.sergio.jwt.backend.dtos.SignUpDto;
import com.sergio.jwt.backend.dtos.UserDto;
import com.sergio.jwt.backend.services.EmailService;
import com.sergio.jwt.backend.services.PasswordResetService;
import com.sergio.jwt.backend.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Map;

import javax.swing.RepaintManager;

@RequiredArgsConstructor
@RestController
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;
    private final UserAuthenticationProvider userAuthenticationProvider;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@RequestBody @Valid CredentialsDto credentialsDto) {
        UserDto userDto = userService.login(credentialsDto);
        userDto.setToken(userAuthenticationProvider.createToken(userDto));
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody @Valid SignUpDto userDto) {
        UserDto createdUser = userService.register(userDto);

        String token = emailService.generateToken(); // Reuse your token generation logic
        userService.createActivationToken(userService.getUser(userDto.getLogin()), token);
        userService.sendActivationEmail(userDto.getLogin(), token);
        return ResponseEntity.created(URI.create("/users/" + createdUser.getId())).body(createdUser);
    }

    @GetMapping("/get-user/{login}")
    public ResponseEntity<UserDto> getUser(@PathVariable String login){
        return ResponseEntity.ok(userService.findByLogin(login));
    }

    @PostMapping("/edit-profile")
    public ResponseEntity<UserDto> editProfile(@RequestBody @Valid SignUpDto userDto) {
        return ResponseEntity.ok(userService.editProfile(userDto));
    }

    
    @PostMapping("/forgot-password")
    public ResponseEntity<UserDto> forgotPassword(@RequestBody @Valid SignUpDto user) {
        return ResponseEntity.ok(passwordResetService.forgotPassword(user));
    }

    @PostMapping("/reset-password/{token}")
    public ResponseEntity<UserDto> resetPassword(
        @PathVariable("token") String token,
        @RequestBody @Valid SignUpDto user) {
        return ResponseEntity.ok(passwordResetService.resetPassword(user,token));
    }

    @PostMapping("/activate-account")
    public ResponseEntity<String> activateAccount(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        boolean activated = userService.activateAccount(token);
        if (activated) {
            return ResponseEntity.ok("Account activated successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Activation failed.");
        }
    }

}