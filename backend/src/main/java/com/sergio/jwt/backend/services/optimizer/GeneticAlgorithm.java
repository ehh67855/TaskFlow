package com.sergio.jwt.backend.services.optimizer;

import java.util.*;
import java.util.stream.Collectors;
import com.sergio.jwt.backend.entites.Node;

public class GeneticAlgorithm {

    // Parameters for controlling the genetic algorithm behavior
    private final double lambda; // Penalty factor for scheduling constraints
    private final double mutationRate; // Probability of mutation for an individual
    private final double crossoverRate; // Probability of crossover between parents
    private final int generations; // Total number of generations to run the algorithm
    private final int populationSize; // Size of the population in each generation
    private final long maxTime; // Maximum allowable time for a schedule

    public GeneticAlgorithm(double lambda, double mutationRate, double crossoverRate, int generations, int populationSize, long maxTime) {
        this.lambda = lambda;
        this.mutationRate = mutationRate;
        this.crossoverRate = crossoverRate;
        this.generations = generations;
        this.populationSize = populationSize;
        this.maxTime = maxTime;
    }

    public List<Node> optimize(List<Node> actionNodes) {
        List<List<Node>> population = initializePopulation(actionNodes);

        List<Node> bestSolution = null;
        double bestFitness = Double.NEGATIVE_INFINITY; 

        // Iterate through the specified number of generations
        for (int gen = 0; gen < generations; gen++) {
            Map<List<Node>, Double> fitnessMap = new HashMap<>();
            for (List<Node> individual : population) {
                double fitness = calculateFitness(individual);
                fitnessMap.put(individual, fitness);
                if (fitness > bestFitness) { 
                    bestFitness = fitness;
                    bestSolution = individual;
                }
            }

            // Log the best solution for the current generation
            System.out.println("Generation " + gen + ": Best Fitness = " + bestFitness);
            System.out.println("Best Individual = " + bestSolution);

            List<List<Node>> selected = performSelection(population, fitnessMap);

            List<List<Node>> offspring = performCrossover(selected);

            population = performMutation(offspring);
        }

        return bestSolution;
    }

    // Initializes the population with random permutations
    private List<List<Node>> initializePopulation(List<Node> actionNodes) {
        List<List<Node>> population = new ArrayList<>();
        Random random = new Random();
        for (int i = 0; i < populationSize; i++) {
            List<Node> individual = new ArrayList<>(actionNodes);
            Collections.shuffle(individual, random); 
            population.add(individual);
        }
        return population;
    }

    // Calculates the fitness score of an individua
    private double calculateFitness(List<Node> individual) {
        long totalTime = 0; 
        double fitness = 0; 

        for (Node node : individual) {
            long time = node.getEstimatedAmountOfTime().toMillis();
            if (totalTime + time > maxTime) break; // stop if we exceed the max time

            // Calculate the difference between max and min BPM for the node
            double deltaBpm = node.getBpmList().stream().max(Double::compare).orElse(0.0) -
                            node.getBpmList().stream().min(Double::compare).orElse(0.0);
            fitness += node.getPriority() * deltaBpm - lambda * node.getDifficulty() * time;
            totalTime += time;
        }

        // Penalize individuals that exceed the max allowable time
        if (totalTime > maxTime) {
            fitness -= lambda * Math.pow(totalTime - maxTime, 2); // Quadratic penalty
        }
        return fitness;
    }

    // Tournament selection
    private List<List<Node>> performSelection(List<List<Node>> population, Map<List<Node>, Double> fitnessMap) {
        List<List<Node>> selected = new ArrayList<>();
        Random rand = new Random();
        for (int i = 0; i < population.size(); i++) {
            // Randomly pick two individuals and select the one with higher fitness
            List<Node> individual1 = population.get(rand.nextInt(population.size()));
            List<Node> individual2 = population.get(rand.nextInt(population.size()));
            selected.add(fitnessMap.get(individual1) > fitnessMap.get(individual2) ? individual1 : individual2);
        }
        return selected;
    }

    // Performs crossover between pairs of selected parents to generate offspring
    private List<List<Node>> performCrossover(List<List<Node>> population) {
        List<List<Node>> offspring = new ArrayList<>();
        Random rand = new Random();

        for (int i = 0; i < population.size(); i += 2) {
            if (rand.nextDouble() < crossoverRate && i + 1 < population.size()) {
                List<Node> parent1 = population.get(i);
                List<Node> parent2 = population.get(i + 1);
                offspring.addAll(singlePointCrossover(parent1, parent2));
            } else {
                // If crossover is not performed, retain the parents
                offspring.add(population.get(i));
                if (i + 1 < population.size()) offspring.add(population.get(i + 1));
            }
        }
        return offspring;
    }

    // Implements single-point crossover
    private List<List<Node>> singlePointCrossover(List<Node> parent1, List<Node> parent2) {
        Random rand = new Random();
        int crossoverPoint = rand.nextInt(parent1.size()); // random crossover point

        // Create two children by combining parts of the parents
        List<Node> child1 = new ArrayList<>(parent1.subList(0, crossoverPoint));
        child1.addAll(parent2.subList(crossoverPoint, parent2.size()));

        List<Node> child2 = new ArrayList<>(parent2.subList(0, crossoverPoint));
        child2.addAll(parent1.subList(crossoverPoint, parent1.size()));

        return Arrays.asList(child1, child2);
    }

    // Swap mustation
    //Swaps two random elements
    private List<List<Node>> performMutation(List<List<Node>> population) {
        Random rand = new Random();
        for (List<Node> individual : population) {
            if (rand.nextDouble() < mutationRate) { // Check if mutation should occur
                int index1 = rand.nextInt(individual.size());
                int index2 = rand.nextInt(individual.size());
                Collections.swap(individual, index1, index2); 
            }
        }
        return population;
    }
}
