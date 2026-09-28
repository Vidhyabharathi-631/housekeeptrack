package com.housekeeptrack.repository;

import com.housekeeptrack.entity.CleaningTask;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CleaningTaskRepository extends JpaRepository<CleaningTask, Long> {
}