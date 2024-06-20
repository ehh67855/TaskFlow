package com.sergio.jwt.backend.entites;


import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
import java.util.Objects;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "networks")
public class Network {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "network", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Node> nodes = new ArrayList<>();

    @OneToMany(mappedBy = "network", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Edge> edges = new ArrayList<>();

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "user_id") // This column will store the ID of the user
    private User user;
}
