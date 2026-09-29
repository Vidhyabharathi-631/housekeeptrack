package com.housekeeptrack.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.housekeeptrack.entity.Room;
import com.housekeeptrack.entity.RoomStatus;
import com.housekeeptrack.repository.RoomRepository;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(Room room) {
        validateRoom(room);
        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, Room changes) {
        validateRoom(changes);
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        room.setRoomNumber(changes.getRoomNumber().trim());
        room.setStatus(changes.getStatus());
        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        }
        roomRepository.deleteById(id);
    }

    public List<Room> getRooms() {
        return roomRepository.findAll();
    }

    public Room getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    public Room changeStatus(Long id, RoomStatus newStatus) {
        Room room = getRoom(id);
        room.setStatus(newStatus);
        return roomRepository.save(room);
    }

    private void validateRoom(Room room) {
        if (room.getRoomNumber() == null || room.getRoomNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room number cannot be empty");
        }
        if (room.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room status is required");
        }
        room.setRoomNumber(room.getRoomNumber().trim());
    }
}