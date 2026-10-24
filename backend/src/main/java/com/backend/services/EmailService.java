package com.backend.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Year;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.backend.entites.User;
import com.backend.repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Sends branded transactional emails via Resend's HTTP API. Every message is multipart:
 * an HTML version rendered from the Thymeleaf templates in resources/templates/email,
 * plus a plain-text alternative for clients that don't render HTML (and to keep spam
 * filters happy).
 *
 * Resend (not SMTP) because the app's host blocks outbound SMTP - a common restriction
 * on shared/free hosting to curb spam, which made Gmail's SMTP server unreachable.
 */
@RequiredArgsConstructor
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final SecureRandom secureRandom = new SecureRandom();

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final UserRepository userRepository;

    private final TemplateEngine templateEngine;

    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.name:Routinary}")
    private String appName;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromAddress;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.api-url:https://api.resend.com/emails}")
    private String resendApiUrl;

    public void sendActivationEmail(User user, String token) {
        String actionUrl = frontendLink("/activate-account", token);
        String subject = "Confirm your email to activate your " + appName + " account";

        Map<String, Object> model = new HashMap<>();
        model.put("actionUrl", actionUrl);
        model.put("token", token);

        String text = """
                %s

                Welcome to %s! Confirm your email address to activate your account:
                %s

                Or enter this activation code on the activation page:
                %s

                This link and code expire in 24 hours.
                """.formatted(greeting(user), appName, actionUrl, token);

        send(user.getLogin(), subject, "email/account-activation", model,
                "Confirm your email address to start using " + appName + ".",
                "You're receiving this because someone signed up for " + appName
                        + " with this address. If it wasn't you, you can ignore this email.",
                greeting(user), text);
    }

    public void sendPasswordResetEmail(User user, String token) {
        String actionUrl = frontendLink("/reset-password", token);
        String subject = "Reset your " + appName + " password";

        Map<String, Object> model = new HashMap<>();
        model.put("actionUrl", actionUrl);
        model.put("email", user.getLogin());

        String text = """
                %s

                We received a request to reset the password for your account (%s).
                Choose a new password here:
                %s

                For your security, this link expires in 1 hour and can only be used once.

                Didn't request this? You can safely ignore this email - your password
                won't change unless you open the link above and set a new one.
                """.formatted(greeting(user), user.getLogin(), actionUrl);

        send(user.getLogin(), subject, "email/password-reset", model,
                "Use this link to choose a new password. It expires in 1 hour.",
                "You're receiving this because a password reset was requested for your "
                        + appName + " account.",
                greeting(user), text);
    }

    public void sendAnnouncement(User user, String subject, String message) {
        Map<String, Object> model = new HashMap<>();
        model.put("message", message);

        String text = """
                %s

                %s

                Open %s: %s
                """.formatted(greeting(user), message, appName, frontendUrl);

        send(user.getLogin(), subject, "email/announcement", model,
                message.lines().findFirst().orElse(subject),
                "You're receiving this because you have a " + appName + " account.",
                greeting(user), text);
    }

    public void sendMessageToAllUsers(String subject, String message) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            sendAnnouncement(user, subject, message);
        }
    }

    public String generateToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private void send(String to, String subject, String template, Map<String, Object> model,
                      String preheader, String footerNote, String greeting, String text) {
        Context context = new Context();
        context.setVariables(model);
        context.setVariable("subject", subject);
        context.setVariable("preheader", preheader);
        context.setVariable("footerNote", footerNote);
        context.setVariable("greeting", greeting);
        context.setVariable("appName", appName);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("year", Year.now().getValue());
        String html = templateEngine.process(template, context);

        if (resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set - skipping email to {} (subject: {})", to, subject);
            return;
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "from", appName + " <" + fromAddress + ">",
                    "to", List.of(to),
                    "subject", subject,
                    "html", html,
                    "text", text));

            HttpRequest request = HttpRequest.newBuilder(URI.create(resendApiUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.warn("Resend rejected email to {} (status {}): {}", to, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            // Non-fatal: whatever triggered this email (registration, password reset, ...)
            // should still succeed even if outbound mail is unreachable or misconfigured.
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String frontendLink(String path, String token) {
        return UriComponentsBuilder.fromHttpUrl(frontendUrl)
                .path(path)
                .queryParam("token", token)
                .toUriString();
    }

    private String greeting(User user) {
        String firstName = user.getFirstName();
        return firstName == null || firstName.isBlank() ? "Hi there," : "Hi " + firstName.trim() + ",";
    }
}
