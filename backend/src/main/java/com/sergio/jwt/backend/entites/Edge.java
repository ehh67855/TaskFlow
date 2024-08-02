package com.sergio.jwt.backend.entites;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Edge {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @JsonBackReference("node-from")
    @ManyToOne
    @JoinColumn(name = "from_id", nullable = false)
    private Node from;

    @JsonBackReference("node-to")
    @ManyToOne
    @JoinColumn(name = "to_id", nullable = false)
    private Node to;

    @JsonBackReference("network-edge")
    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;
}
