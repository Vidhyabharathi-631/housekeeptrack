package com.housekeeptrack.service;

import com.housekeeptrack.entity.*;
import com.housekeeptrack.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class HousekeepingService {

    private final RoomRepository roomRepository;
    private final HousekeeperRepository housekeeperRepository;
    private final CleaningTaskRepository taskRepository;
    private final InspectionRepository inspectionRepository;

    public HousekeepingService(
            RoomRepository roomRepository,
            HousekeeperRepository housekeeperRepository,
            CleaningTaskRepository taskRepository,
            InspectionRepository inspectionRepository) {

        this.roomRepository = roomRepository;
        this.housekeeperRepository = housekeeperRepository;
        this.taskRepository = taskRepository;
        this.inspectionRepository = inspectionRepository;
    }

    public CleaningTask assignCleaningTask(Long roomId) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() != RoomStatus.DIRTY) {
            throw new RuntimeException("Room is not dirty");
        }

        Housekeeper housekeeper = housekeeperRepository
                .findFirstByAvailableTrue()
                .orElseThrow(() -> new RuntimeException("No housekeeper available"));

        CleaningTask task = new CleaningTask();
        task.setRoom(room);
        task.setHousekeeper(housekeeper);
        task.setAssignedAt(LocalDateTime.now());

        room.setStatus(RoomStatus.CLEANING);
        housekeeper.setAvailable(false);

        roomRepository.save(room);
        housekeeperRepository.save(housekeeper);

        return taskRepository.save(task);
    }

    public Inspection inspectTask(Long taskId, boolean passed) {

        CleaningTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Cleaning task not found"));

        Inspection inspection = new Inspection();
        inspection.setTask(task);
        inspection.setPassed(passed);
        inspection.setInspectedAt(LocalDateTime.now());

        Room room = task.getRoom();

        if (passed) {
            room.setStatus(RoomStatus.READY);
        } else {
            room.setStatus(RoomStatus.CLEANING);
        }

        task.setCompletedAt(LocalDateTime.now());
        task.getHousekeeper().setAvailable(true);

        roomRepository.save(room);
        housekeeperRepository.save(task.getHousekeeper());
        taskRepository.save(task);

        return inspectionRepository.save(inspection);
    }
}