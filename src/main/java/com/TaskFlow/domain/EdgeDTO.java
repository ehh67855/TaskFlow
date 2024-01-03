package com.TaskFlow.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "edges")
public class EdgeDTO {
    private @Id @GeneratedValue(strategy = GenerationType.IDENTITY) int id;
    @Column(name = "from_node")
    private int from;
    @Column(name = "to_node")
    private int to;
}