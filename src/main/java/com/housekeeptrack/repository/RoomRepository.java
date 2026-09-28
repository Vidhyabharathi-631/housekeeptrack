package com.housekeeptrack.repository;

import com.housekeeptrack.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}