package com.TaskFlow.web;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.TaskFlow.domain.EdgeDTO;
import com.TaskFlow.domain.NodeDTO;
import com.TaskFlow.repository.EdgeDTORepository;
import com.TaskFlow.repository.NodeDTORepository;
import com.TaskFlow.service.CustomUserDetailsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
public class HomeController {

    @Autowired NodeDTORepository nodeRepo;
    @Autowired EdgeDTORepository edgeRepo;
    @Autowired CustomUserDetailsService userService;
    
    @GetMapping("/")
    public String index(){
        return "index";
    }

    @GetMapping("/about")
    public String about() {
        return "about";
    }

    @GetMapping("/checklist")
    public String checklist() {
        return "checklist";
    }

    @GetMapping("/configuration")
    public String configuration() {
        return "configuration";
    }

    @GetMapping("/network")
    public String network(Principal principal, Model model) throws JsonProcessingException  {

        // UserAccount user = userService.getUserAccountByUsername(principal.getName());
        // List<NodeDTO> nodes = nodeRepo.findAll();
        // List<EdgeDTO> edges = edgeRepo.findAll();
        List<NodeDTO> nodes = userService.getUserNodes(principal.getName());
        List<EdgeDTO> edges = userService.getUserEdges(principal.getName());
        
        ObjectMapper objectMapper = new ObjectMapper();
        String nodesJson = objectMapper.writeValueAsString(nodes);
        String edgesJson = objectMapper.writeValueAsString(edges);
        
        model.addAttribute("nodesJson", nodesJson);
        model.addAttribute("edgesJson", edgesJson);

        return "network";
    }

}

