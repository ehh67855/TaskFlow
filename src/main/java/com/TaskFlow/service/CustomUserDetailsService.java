package com.TaskFlow.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.TaskFlow.domain.EdgeDTO;
import com.TaskFlow.domain.NodeDTO;
import com.TaskFlow.domain.UserAccount;
import com.TaskFlow.domain.UserRegistrationDTO;
import com.TaskFlow.repository.EdgeDTORepository;
import com.TaskFlow.repository.NodeDTORepository;
import com.TaskFlow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired UserRepository userRepository;
    @Autowired NodeDTORepository nodeRepository;
    @Autowired EdgeDTORepository edgeRepository;

    @Bean
	CommandLineRunner init(@Autowired UserRepository repo) {
		return args -> {
			UserAccount user = new UserAccount();
			user.setUsername("user");
			user.setPassword("pass");
			user.setAuthorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
            user.setNodeIds(Collections.singletonList(1L));
			userRepository.save(user);
		};
	}

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new User(user.getUsername(), passwordEncoder().encode(user.getPassword()),user.getAuthorities());
    }

    public UserAccount getUserAccountByUsername(String username) {
            return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public void registerUser(UserRegistrationDTO registrationDTO) {
        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(registrationDTO.getUsername());
        userAccount.setPassword(registrationDTO.getPassword());
        userAccount.setAuthorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        NodeDTO root = new NodeDTO();
        root.setColor("grey");
        NodeDTO savedNode = nodeRepository.save(root);
        userAccount.getNodeIds().add(Long.valueOf(savedNode.getId()));

        userRepository.save(userAccount);
    }

    public boolean usernameTaken(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public void updateUser(UserAccount user) {
        userRepository.save(user);
    }

    public List<NodeDTO> getUserNodes(String username) {
        UserAccount user = getUserAccountByUsername(username);
        ArrayList<NodeDTO> userNodes = new ArrayList<>();
        try {
            for (Long id : user.getNodeIds()) {
                userNodes.add(nodeRepository.findById(id).orElseThrow(() -> new Exception("User node not found")));
            }
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
        return userNodes;
    }

    public List<EdgeDTO> getUserEdges(String username) {
        UserAccount user = getUserAccountByUsername(username);
        ArrayList<EdgeDTO> userEdges = new ArrayList<>();
        try {
            for(Long id: user.getEdgeIds()) {
                userEdges.add(edgeRepository.findById(id).orElseThrow( () -> new Exception("User Edge not found")));
            }
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
        return userEdges;
    }

}