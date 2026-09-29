package com.housekeeptrack.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.housekeeptrack.entity.Housekeeper;
import com.housekeeptrack.service.HousekeeperService;

@RestController
@RequestMapping("/housekeepers")
public class HousekeeperController {

    private final HousekeeperService service;

    public HousekeeperController(HousekeeperService service) {
        this.service = service;
    }

    @PostMapping
    public Housekeeper add(@RequestBody Housekeeper housekeeper) {
        return service.addHousekeeper(housekeeper);
    }

    @PutMapping("/{id}")
    public Housekeeper update(@PathVariable Long id, @RequestBody Housekeeper housekeeper) {
        return service.updateHousekeeper(id, housekeeper);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteHousekeeper(id);
    }

    @GetMapping
    public List<Housekeeper> getAll() {
        return service.getHousekeepers();
    }
}