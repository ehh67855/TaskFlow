package com.backend.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.backend.dtos.UserDto;
import com.backend.services.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

// Runs after Google confirms the user's identity. Finds-or-creates the local User by email,
// mints the same JWT password login uses, then hands it to the frontend via a URL fragment -
// fragments never get sent to any server (not even ours), so this keeps the token out of
// server access logs and Referer headers on the redirect itself.
@RequiredArgsConstructor
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final UserAuthenticationProvider userAuthenticationProvider;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        if (email == null || email.isBlank()) {
            response.sendRedirect(frontendUrl + "/login?error=oauth");
            return;
        }

        try {
            UserDto userDto = userService.findOrCreateOAuthUser(email, firstName, lastName);
            String token = userAuthenticationProvider.createToken(userDto);
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/oauth-callback#token=" + encodedToken);
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=oauth");
        }
    }
}
