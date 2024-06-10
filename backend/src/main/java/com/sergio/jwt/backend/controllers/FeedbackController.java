package com.sergio.jwt.backend.controllers;

import java.util.List;

import org.apache.catalina.connector.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sergio.jwt.backend.dtos.FeedbackDto;
import com.sergio.jwt.backend.entites.Feedback;
import com.sergio.jwt.backend.repositories.FeedBackRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedBackRepository feedBackRepository;

    @PostMapping("/feedback")
    public ResponseEntity<Feedback> feedback(@RequestBody @Valid FeedbackDto feedback) {

        System.out.println(feedback);

        return ResponseEntity.ok(feedBackRepository.save(Feedback.builder().feedback(feedback.feedback()).build()));
    }
}
