package com.sergio.jwt.backend.services.optimizer;


import java.time.Duration;
import java.util.*;

import com.sergio.jwt.backend.entites.Network;
import com.sergio.jwt.backend.entites.Node;

public class RoutineOptimizer {
    private Map<Node, List<Node>> adjacencyList;
    private Map<Node, Double> nodeScores;

    public RoutineOptimizer(Network network) {
        this.adjacencyList = network.getAdjacencyList();
        this.nodeScores = new HashMap<>();
        initializeNodeScores();
    }

    private void initializeNodeScores() {
        for (Node node : adjacencyList.keySet()) {
            nodeScores.put(node, calculateNodeScore(node));
        }
    }

    private double calculateNodeScore(Node node) {
        double score = 0;
        score += node.getPriority() * 2.0; // Higher weight for priority
        score += node.getDifficulty() * 1.5; // Consider difficulty
        score += node.isAreaOfFocus() ? 5.0 : 0.0; // Add significant weight if it's an area of focus
        score -= node.getNumberOfTimesPracticed() * 0.5; // Reduce score if practiced many times
        score -= node.getTotalAmountOfTimePracticed().toMinutes() * 0.1; // Reduce based on total time practiced
        return score;
    }

    public Node findNodeWithMinimumScore() {
        return Collections.min(nodeScores.entrySet(), Map.Entry.comparingByValue()).getKey();
    }

    public void selectNodeAndBoostSurrounding(Node selectedNode) {
        List<Node> surroundingNodes = adjacencyList.get(selectedNode);
        if (surroundingNodes != null) {
            for (Node node : surroundingNodes) {
                double currentScore = nodeScores.get(node);
                nodeScores.put(node, currentScore + 2.0); // Boost surrounding node's score
            }
        }
    }

    public void updateSelectedNode(Node selectedNode) {
        nodeScores.put(selectedNode, calculateNodeScore(selectedNode)); // Recalculate score if needed
        selectNodeAndBoostSurrounding(selectedNode);
    }

    public List<Node> optimize(Duration maxTime) {
        List<Node> nodes = new ArrayList<>(nodeScores.keySet());
        int n = nodes.size();
        int maxMinutes = (int) maxTime.toMinutes();

        double[][] dp = new double[n + 1][maxMinutes + 1];
        boolean[][] keep = new boolean[n + 1][maxMinutes + 1];

        for (int i = 1; i <= n; i++) {
            Node node = nodes.get(i - 1);
            int time = (int) node.getEstimatedAmountOfTime().toMinutes();
            double score = nodeScores.get(node);

            for (int j = 0; j <= maxMinutes; j++) {
                if (time <= j) {
                    if (dp[i - 1][j] < dp[i - 1][j - time] + score) {
                        dp[i][j] = dp[i - 1][j - time] + score;
                        keep[i][j] = true;
                    } else {
                        dp[i][j] = dp[i - 1][j];
                    }
                } else {
                    dp[i][j] = dp[i - 1][j];
                }
            }
        }

        List<Node> selectedNodes = new ArrayList<>();
        for (int i = n, j = maxMinutes; i > 0; i--) {
            if (keep[i][j]) {
                Node node = nodes.get(i - 1);
                selectedNodes.add(node);
                j -= (int) node.getEstimatedAmountOfTime().toMinutes();
                updateSelectedNode(node);
            }
        }

        return selectedNodes;
    }

    // For debugging purposes
    public void printNodeScores() {
        for (Map.Entry<Node, Double> entry : nodeScores.entrySet()) {
            System.out.println("Node: " + entry.getKey().getId() + ", Score: " + entry.getValue());
        }
    }

    
}