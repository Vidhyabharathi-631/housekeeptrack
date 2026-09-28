package com.housekeeptrack.repository;

import com.housekeeptrack.entity.Housekeeper;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HousekeeperRepository extends JpaRepository<Housekeeper, Long> {

    Optional<Housekeeper> findFirstByAvailableTrue();
}