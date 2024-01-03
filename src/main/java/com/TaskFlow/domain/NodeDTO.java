package com.TaskFlow.domain;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NodeDTO{
    private @Id @GeneratedValue(strategy = GenerationType.IDENTITY) int id;
    private String label;
    private String title;
    private int x;
    private int y;
    private String color;

}