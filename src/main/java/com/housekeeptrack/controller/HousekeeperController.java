package com.housekeeptrack.controller;

import com.housekeeptrack.entity.Housekeeper;
import com.housekeeptrack.repository.HousekeeperRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/housekeepers")
public class HousekeeperController {

    private final HousekeeperRepository repository;

    public HousekeeperController(HousekeeperRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public Housekeeper add(@RequestBody Housekeeper housekeeper) {
        return repository.save(housekeeper);
    }

    @GetMapping
    public List<Housekeeper> getAll() {
        return repository.findAll();
    }
}