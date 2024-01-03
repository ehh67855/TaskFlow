package com.TaskFlow.domain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Set;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @ToString
@Table(name = "users")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private boolean enabled = true;
    
    @Column(nullable = false)
    @ElementCollection(fetch = FetchType.EAGER)
    private List<GrantedAuthority> authorities = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    private List<Long> nodeIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    private List<Long> edgeIds = new ArrayList<>();

}
