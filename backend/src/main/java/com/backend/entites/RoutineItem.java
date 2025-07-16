package com.backend.entites;

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
public class RoutineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private long amountOfTime; // in milliseconds
    private String itemName;
    private Long nodeId;
    private String nodeDescription;
    
    @JsonBackReference("routine-item")
    @ManyToOne
    @JoinColumn(name = "routine_id", nullable = false)
    private Routine routine;
}
