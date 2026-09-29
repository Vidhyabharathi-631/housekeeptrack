package com.housekeeptrack.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.housekeeptrack.entity.Housekeeper;
import com.housekeeptrack.repository.HousekeeperRepository;

@Service
public class HousekeeperService {

    private final HousekeeperRepository housekeeperRepository;

    public HousekeeperService(HousekeeperRepository housekeeperRepository) {
        this.housekeeperRepository = housekeeperRepository;
    }

    public List<Housekeeper> getHousekeepers() {
        return housekeeperRepository.findAll();
    }

    public Housekeeper addHousekeeper(Housekeeper housekeeper) {
        validateName(housekeeper);
        return housekeeperRepository.save(housekeeper);
    }

    public Housekeeper updateHousekeeper(Long id, Housekeeper changes) {
        validateName(changes);
        Housekeeper housekeeper = housekeeperRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Housekeeper not found"));
        housekeeper.setName(changes.getName().trim());
        housekeeper.setAvailable(changes.isAvailable());
        return housekeeperRepository.save(housekeeper);
    }

    public void deleteHousekeeper(Long id) {
        if (!housekeeperRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Housekeeper not found");
        }
        housekeeperRepository.deleteById(id);
    }

    private void validateName(Housekeeper housekeeper) {
        if (housekeeper.getName() == null || housekeeper.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Housekeeper name cannot be empty");
        }
        housekeeper.setName(housekeeper.getName().trim());
    }
}