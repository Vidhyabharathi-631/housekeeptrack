package com.housekeeptrack.service;

import com.housekeeptrack.entity.Room;
import com.housekeeptrack.entity.RoomStatus;
import com.housekeeptrack.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(Room room) {
        return roomRepository.save(room);
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

        if (!isValidTransition(room.getStatus(), newStatus)) {
            throw new RuntimeException("Invalid room status transition");
        }

        room.setStatus(newStatus);
        return roomRepository.save(room);
    }

    private boolean isValidTransition(RoomStatus oldStatus, RoomStatus newStatus) {

        return (oldStatus == RoomStatus.DIRTY && newStatus == RoomStatus.CLEANING)
                || (oldStatus == RoomStatus.CLEANING && newStatus == RoomStatus.INSPECTED)
                || (oldStatus == RoomStatus.INSPECTED && newStatus == RoomStatus.READY)
                || (oldStatus == RoomStatus.INSPECTED && newStatus == RoomStatus.CLEANING);
    }
}