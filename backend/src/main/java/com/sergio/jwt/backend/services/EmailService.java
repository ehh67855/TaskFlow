package com.sergio.jwt.backend.services;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.sergio.jwt.backend.entites.User;
import com.sergio.jwt.backend.repositories.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired UserRepository userRepository;


    private static final SecureRandom secureRandom = new SecureRandom();

    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage(); 
        message.setFrom("cinemaapplication9@gmail.com");
        message.setTo(to); 
        message.setSubject(subject); 
        message.setText(text);
        mailSender.send(message);
    }

    public void sendHtmlEmail() throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();

        message.setFrom(new InternetAddress("sender@example.com"));
        message.setRecipients(MimeMessage.RecipientType.TO, "recipient@example.com");
        message.setSubject("Test email from Spring");

        String htmlContent = "<h1>This is a test Spring Boot email</h1>" +
                            "<p>It can contain <strong>HTML</strong> content.</p>";
        message.setContent(htmlContent, "text/html; charset=utf-8");

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Password Reset Request";
        String text = "To reset your password, use the link below:\n\n"
                      + "http://localhost:4200/reset-password?token=" + token;

        sendSimpleMessage(to, subject, text);
    }

    public String generateToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public void sendMessageToAllUsers(String subject, String text) {
        List<User> users = userRepository.findAll();
        for(User user : users) {
            sendSimpleMessage(user.getLogin(), subject, text);
        }
    }
}