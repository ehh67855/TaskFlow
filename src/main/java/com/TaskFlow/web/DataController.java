package com.TaskFlow.web;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.TaskFlow.domain.EdgeDTO;
import com.TaskFlow.domain.NodeDTO;
import com.TaskFlow.service.DataService;
import com.fasterxml.jackson.databind.util.ArrayBuilders.LongBuilder;


@Controller
@RequestMapping("/network/api")
public class DataController {

    @Autowired DataService dataService;

    @PostMapping("/nodes")
    public ResponseEntity<NodeDTO> createNode(@RequestBody NodeDTO newNode, Principal principal) {
        return dataService.createNode(newNode, principal.getName());
    }
    
    @PostMapping("/edges")
    public ResponseEntity<EdgeDTO> createEdge(@RequestBody EdgeDTO newEdge, Principal principal) {
        return dataService.createEdge(newEdge, principal.getName());
    }
    
    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<NodeDTO> deleteNode(@PathVariable Long id, Principal principal) {
        return dataService.deleteNode(id, principal.getName());
    }

    @DeleteMapping("/edges/{id}")
    public ResponseEntity<EdgeDTO> deleteEdge(@PathVariable Long id, Principal principal) {
        return dataService.deleteEdge(id, principal.getName());
    }

    @PutMapping("/edges/{id}/{from}/{to}")
    public ResponseEntity<String> updateEdge(@PathVariable Long id, 
                                        @PathVariable Integer from, 
                                        @PathVariable Integer to) {
        dataService.updateEdge(id,from,to);
        return ResponseEntity.ok("Edge updated"); // You can return the updated edge if needed

    }


    @PutMapping("/nodes")
    public @ResponseBody ResponseEntity<NodeDTO> updateNode(
        @RequestParam("selectedNodeId") Long selectedNodeId,
        @RequestParam("title") String title,
        @RequestParam("description") String description) {
        return dataService.updateNode(selectedNodeId,title,description);
    }

    @PutMapping("/nodes/color")
    public ResponseEntity<NodeDTO> updateNodeColor(
        @RequestParam("selectedNodeId") Long selectedNodeId,
        @RequestParam("color") String color) {
            return dataService.updateNodeColor(selectedNodeId,color);
    }
    
}