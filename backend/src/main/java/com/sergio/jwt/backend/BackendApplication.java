package com.sergio.jwt.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.sergio.jwt.backend.dtos.SignUpDto;
import com.sergio.jwt.backend.entites.User;
import com.sergio.jwt.backend.enums.Role;
import com.sergio.jwt.backend.repositories.UserRepository;
import com.sergio.jwt.backend.services.UserService;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
