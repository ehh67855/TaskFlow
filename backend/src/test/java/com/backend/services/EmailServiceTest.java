package com.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.backend.entites.User;
import com.backend.repositories.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;

class EmailServiceTest {

    private UserRepository userRepository;
    private EmailService emailService;
    private HttpServer resendStub;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BlockingQueue<Map<String, Object>> receivedRequests = new ArrayBlockingQueue<>(10);

    @BeforeEach
    void setUp() throws IOException {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        userRepository = mock(UserRepository.class);

        resendStub = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        resendStub.createContext("/emails", exchange -> {
            byte[] body = exchange.getRequestBody().readAllBytes();
            receivedRequests.add(objectMapper.readValue(body, Map.class));
            byte[] response = "{\"id\":\"test\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });
        resendStub.start();

        emailService = new EmailService(userRepository, templateEngine, objectMapper);
        ReflectionTestUtils.setField(emailService, "frontendUrl", "https://app.example.com");
        ReflectionTestUtils.setField(emailService, "appName", "Routinary");
        ReflectionTestUtils.setField(emailService, "fromAddress", "no-reply@example.com");
        ReflectionTestUtils.setField(emailService, "resendApiKey", "test-key");
        ReflectionTestUtils.setField(emailService, "resendApiUrl",
                "http://localhost:" + resendStub.getAddress().getPort() + "/emails");
    }

    @AfterEach
    void tearDown() {
        resendStub.stop(0);
    }

    @Test
    void activationEmailLinksToActivationPageWithToken() throws Exception {
        emailService.sendActivationEmail(user("Ada", "ada@example.com"), "abc123");

        Map<String, Object> request = nextRequest();
        assertThat(request.get("to")).isEqualTo(List.of("ada@example.com"));
        assertThat(request.get("subject")).isEqualTo("Confirm your email to activate your Routinary account");
        assertThat((String) request.get("html")).contains("https://app.example.com/activate-account?token=abc123");
        assertThat((String) request.get("text")).contains("https://app.example.com/activate-account?token=abc123");
        assertThat((String) request.get("text")).contains("Hi Ada,");
    }

    @Test
    void passwordResetEmailLinksToResetPageWithToken() throws Exception {
        emailService.sendPasswordResetEmail(user(null, "bob@example.com"), "xyz789");

        Map<String, Object> request = nextRequest();
        assertThat(request.get("subject")).isEqualTo("Reset your Routinary password");
        assertThat((String) request.get("html")).contains("https://app.example.com/reset-password?token=xyz789");
        assertThat((String) request.get("text")).contains("Hi there,");
    }

    @Test
    void announcementEscapesUserProvidedContent() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of(user("Eve", "eve@example.com")));

        emailService.sendMessageToAllUsers("News", "<script>alert(1)</script>");

        Map<String, Object> request = nextRequest();
        String html = (String) request.get("html");
        assertThat(html).doesNotContain("<script>");
        assertThat(html).contains("&lt;script&gt;alert(1)&lt;/script&gt;");
    }

    private Map<String, Object> nextRequest() throws InterruptedException {
        Map<String, Object> request = receivedRequests.poll(5, TimeUnit.SECONDS);
        assertThat(request).as("Resend stub never received a request").isNotNull();
        return request;
    }

    private static User user(String firstName, String login) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLogin(login);
        return user;
    }
}
