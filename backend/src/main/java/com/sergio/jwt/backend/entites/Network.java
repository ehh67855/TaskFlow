package com.sergio.jwt.backend.entites;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    private String quantifier;

    @JsonManagedReference("network-node")
    @OneToMany(mappedBy = "network", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Node> nodes = new ArrayList<>();

    @JsonManagedReference("network-edge")
    @OneToMany(mappedBy = "network", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Edge> edges = new ArrayList<>();

    @JsonBackReference("user-network")
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    public Map<Node, List<Node>> getAdjacencyList() {
        Map<Node, List<Node>> adjacencyList = new HashMap<>();

        for (Node node : nodes) {
            adjacencyList.putIfAbsent(node, new ArrayList<>());
        }

        for (Edge edge : edges) {
            adjacencyList.get(edge.getFrom()).add(edge.getTo());
        }

        return adjacencyList;
    }
}
