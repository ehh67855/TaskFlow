package com.backend.entites;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

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
    @JoinColumn(name = "from_id", nullable = false)
    @JsonManagedReference("node-from")
    private Node from;

    @ManyToOne
    @JoinColumn(name = "to_id", nullable = false)
    @JsonManagedReference("node-to")
    private Node to;

    @ManyToOne
    @JoinColumn(name = "network_id", nullable = false)
    @JsonBackReference("network-edge")
    private Network network;
}
