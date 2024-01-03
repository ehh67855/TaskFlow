package com.TaskFlow.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.security.SecurityProperties.User;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.memory.UserAttribute;
import org.springframework.stereotype.Service;

import com.TaskFlow.domain.EdgeDTO;
import com.TaskFlow.domain.NodeDTO;
import com.TaskFlow.domain.UserAccount;
import com.TaskFlow.repository.EdgeDTORepository;
import com.TaskFlow.repository.NodeDTORepository;


@Service
public class DataService {
    @Autowired NodeDTORepository nodeRepo;
    @Autowired EdgeDTORepository edgeRepo;
    @Autowired CustomUserDetailsService userService;

    @Bean
    CommandLineRunner initHead() {
        return args -> {
            NodeDTO node = new NodeDTO();
            node.setColor("grey");
            node.setId(0);
            nodeRepo.save(node);
        };
    }

    public ResponseEntity<NodeDTO> createNode(NodeDTO newNode, String username) {

        UserAccount user = userService.getUserAccountByUsername(username);

        //Update new node list
        newNode.setColor("yellow");
        NodeDTO savedNode = nodeRepo.save(newNode);
        ArrayList<Long> newNodeIds = new ArrayList<>(user.getNodeIds());
        newNodeIds.add(Long.valueOf(savedNode.getId()));
        
        //Update User database
        user.setNodeIds(newNodeIds);
        userService.updateUser(user);
        
        return ResponseEntity.ok(newNode);
    }

    public ResponseEntity<EdgeDTO> createEdge(EdgeDTO newEdge, String username) {

        //Update user
        UserAccount user = userService.getUserAccountByUsername(username);
        EdgeDTO  savedEdge = edgeRepo.save(newEdge);
        ArrayList<Long> newEdgeIds = new ArrayList<>(user.getEdgeIds());
        newEdgeIds.add(Long.valueOf(savedEdge.getId()));

        user.setEdgeIds(newEdgeIds);
        userService.updateUser(user);

        return ResponseEntity.ok(newEdge);
    }

    public ResponseEntity<NodeDTO> deleteNode(Long id, String username) {
        try {
            NodeDTO node = nodeRepo.findById(id)
                .orElseThrow(() -> new Exception("Node not found with id : " + id));
            nodeRepo.deleteById(id);
            //Update user
            UserAccount user = userService.getUserAccountByUsername(username);
            ArrayList<Long> userEdges = new ArrayList<>(user.getNodeIds());
            userEdges.remove(id);
            user.setEdgeIds(userEdges);
            userService.updateUser(user);

            return ResponseEntity.ok(node); // Return a 200 OK response on successful deletion
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<EdgeDTO> deleteEdge(Long id, String username) {
        try {
            
            EdgeDTO edge = edgeRepo.findById(id)
                .orElseThrow(() -> new Exception("Edge not found with id : " + id));
            edgeRepo.deleteById(id);
            //remove from user account
            UserAccount user = userService.getUserAccountByUsername(username);
            ArrayList<Long> userEdges = new ArrayList<>(user.getEdgeIds());
            userEdges.remove(id);
            user.setEdgeIds(userEdges);
            userService.updateUser(user);
            return ResponseEntity.ok(edge); // Return a 200 OK response on successful deletion
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<NodeDTO> updateNode(Long selectedNodeId,String title, String description) {
        try {
            NodeDTO node = nodeRepo.findById(selectedNodeId).orElseThrow(() -> new Exception("Node not found"));
            if (!(title.equals("") || title == null))
                node.setLabel(title);
            if (!(description.equals("") || description == null))
                node.setTitle(description);
            nodeRepo.save(node);
            return ResponseEntity.ok(node);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<NodeDTO> updateNodeColor(Long selectedNodeId, String color) {
        try {
            NodeDTO node = nodeRepo.findById(selectedNodeId).orElseThrow(() -> new Exception("Node not found"));
            node.setColor(color);
            nodeRepo.save(node);
            return ResponseEntity.ok(node);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public void updateEdge(Long id, Integer from, Integer to) {
        try {
            EdgeDTO edge = edgeRepo.findById(id).orElseThrow( () -> new Exception("edge not found"));
            edge.setTo(to);
            edge.setFrom(from);
            edgeRepo.save(edge);
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
    }
}
