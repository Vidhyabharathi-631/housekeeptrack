package com.housekeeptrack.controller;

import com.housekeeptrack.entity.Room;
import com.housekeeptrack.service.RoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService service;

    public RoomController(RoomService service) {
        this.service = service;
    }

    @PostMapping
    public Room add(@RequestBody Room room) {
        return service.addRoom(room);
    }

    @GetMapping
    public List<Room> getAll() {
        return service.getRooms();
    }
}