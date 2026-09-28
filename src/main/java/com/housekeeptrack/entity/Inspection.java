package com.housekeeptrack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean passed;

    private LocalDateTime inspectedAt;

    @ManyToOne
    private CleaningTask task;

    public Long getId() {
        return id;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }

    public CleaningTask getTask() {
        return task;
    }

    public void setTask(CleaningTask task) {
        this.task = task;
    }
}