package com.housekeeptrack.controller;

import com.housekeeptrack.entity.Room;
import com.housekeeptrack.entity.RoomStatus;
import com.housekeeptrack.service.RoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public Room addRoom(@RequestBody Room room) {
        return roomService.addRoom(room);
    }

    @GetMapping
    public List<Room> getRooms() {
        return roomService.getRooms();
    }

    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    @PutMapping("/{id}/status")
    public Room changeStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {

        return roomService.changeStatus(id, status);
    }
}