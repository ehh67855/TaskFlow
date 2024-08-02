package com.sergio.jwt.backend.entites;

import java.time.Duration;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;
    private String color;
    private String title;
    private String description;
    private Duration estimatedAmountOfTime;
    private int difficulty;
    private int priority;
    private boolean areaOfFocus;
    private int numberOfTimesPracticed;
    private Duration totalAmountOfTimePracticed;
    private double average;

    @JsonManagedReference("node-from")
    @OneToMany(mappedBy = "from")
    private Set<Edge> edgesFrom;

    @JsonManagedReference("node-to")
    @OneToMany(mappedBy = "to")
    private Set<Edge> edgesTo;

    @JsonBackReference("network-node")
    @ManyToOne
    @JoinColumn(name = "network_id")
    private Network network;
}
