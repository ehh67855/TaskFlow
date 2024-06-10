package com.sergio.jwt.backend.entites;

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

    @ManyToOne
    @JoinColumn(name = "from_node_id", nullable = false)
    private Node fromNode;

    @ManyToOne
    @JoinColumn(name = "to_node_id", nullable = false)
    private Node toNode;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    private Network network;
}