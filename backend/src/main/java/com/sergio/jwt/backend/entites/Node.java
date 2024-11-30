package com.sergio.jwt.backend.entites;

import java.time.Duration;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import lombok.ToString;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString(onlyExplicitlyIncluded = true)

public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ToString.Include
    private String label;
    @ToString.Include
    private String color;
    @ToString.Include
    private String title;
    private String description;
    @ToString.Include
    private Duration estimatedAmountOfTime;
    @ToString.Include
    private int difficulty;
    @ToString.Include
    private int priority;
    @ToString.Include
    private boolean areaOfFocus;
    @ToString.Include
    private int numberOfTimesPracticed;
    @ToString.Include
    @Builder.Default
    private Duration totalAmountOfTimePracticed = Duration.ZERO;
    @ToString.Include
    private double average;

    @ElementCollection
    @CollectionTable(name = "node_bpm", joinColumns = @JoinColumn(name = "node_id"))
    @Column(name = "bpm")
    private List<Double> bpmList;


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
