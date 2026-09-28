package com.backend.entites;

import java.time.LocalDateTime;
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

    // Null means this network is at the top level, not filed under a folder.
    @JsonBackReference("folder-network")
    @ManyToOne
    @JoinColumn(name = "folder_id")
    private Folder folder;

    // Whether the owner has listed this network on the marketplace for other users to
    // browse and clone into their own account. publishedAt is only meaningful when true -
    // it drives the marketplace's default (newest-first) ordering.
    @Builder.Default
    private boolean published = false;

    private LocalDateTime publishedAt;

    // Separate from `published` - this controls whether the network shows up on your friends'
    // "Friends' Networks" feed, independent of whether it's ever been shared to the public
    // marketplace. Defaults to true so friends can see a network unless its owner opts a
    // specific one out.
    @Builder.Default
    private boolean visibleToFriends = true;

    // folder is a @JsonBackReference (hidden from JSON to avoid recursing back into the
    // folder's own network list), so this exposes just the id the frontend needs to place
    // this network in the folder tree.
    public Long getFolderId() {
        return folder != null ? folder.getId() : null;
    }

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
