package com.TaskFlow.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.ModelAndView;

import com.TaskFlow.domain.UserAccount;
import com.TaskFlow.domain.UserRegistrationDTO;
import com.TaskFlow.service.CustomUserDetailsService;

@Controller
public class UserController {

    @Autowired CustomUserDetailsService customUserDetailsService;
    
    @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    @GetMapping("/signup")
    public String signup(Model model) {
        model.addAttribute("user", new UserRegistrationDTO());
        return "signup";
    }

    @GetMapping("/signuperror")
    public String signupError() {
        return "signuperror";
    }

    @PostMapping("/signup")
    public String registerUserAccount(@ModelAttribute("user") UserRegistrationDTO registrationDto) {
        if (customUserDetailsService.usernameTaken(registrationDto.getUsername()))
            return "redirect:/signuperror";
        customUserDetailsService.registerUser(registrationDto);
        return "redirect:/login";
    }
}

