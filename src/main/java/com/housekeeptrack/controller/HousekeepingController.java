package com.housekeeptrack.controller;

import com.housekeeptrack.entity.CleaningTask;
import com.housekeeptrack.entity.Inspection;
import com.housekeeptrack.service.HousekeepingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/housekeeping")
public class HousekeepingController {

    private final HousekeepingService service;

    public HousekeepingController(HousekeepingService service) {
        this.service = service;
    }

    @PostMapping("/rooms/{roomId}/clean")
    public CleaningTask cleanRoom(@PathVariable Long roomId) {
        return service.assignCleaningTask(roomId);
    }

    @PostMapping("/tasks/{taskId}/inspect")
    public Inspection inspect(
            @PathVariable Long taskId,
            @RequestParam boolean passed) {

        return service.inspectTask(taskId, passed);
    }
}