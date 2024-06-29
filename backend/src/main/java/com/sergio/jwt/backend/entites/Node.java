package com.sergio.jwt.backend.entites;

import java.time.Duration;
import java.util.List;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @OneToMany(cascade = CascadeType.ALL)
    private List<Node> relatedNodes;

    private int numberOfTimesPracticed;

    private Duration totalAmountOfTimePracticed;

    private double averageBpm;

    @ManyToOne
    @JoinColumn(name = "network_id")
    @JsonBackReference
    private Network network;
}
