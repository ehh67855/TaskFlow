package com.backend.entites;

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
    private String label;
    private String color;
    @ToString.Include
    private String title;
    private String description;
    private Duration estimatedAmountOfTime;
    private int difficulty;
    private int priority;
    private boolean areaOfFocus;
    @ToString.Include
    private int numberOfTimesPracticed;
    @ToString.Include
    @Builder.Default
    private Duration totalAmountOfTimePracticed = Duration.ZERO;
    @ToString.Include
    private double average;

    @ElementCollection
    @CollectionTable(name = "node_quantifier", joinColumns = @JoinColumn(name = "node_id"))
    @Column(name = "quantifier_value")
    @ToString.Include
    private List<Double> quantifierValues;


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
