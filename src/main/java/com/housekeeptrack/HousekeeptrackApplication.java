package com.housekeeptrack;

import com.housekeeptrack.entity.Housekeeper;
import com.housekeeptrack.entity.Room;
import com.housekeeptrack.entity.RoomStatus;
import com.housekeeptrack.repository.HousekeeperRepository;
import com.housekeeptrack.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@SpringBootApplication
public class HousekeeptrackApplication {

	public static void main(String[] args) {
		SpringApplication.run(HousekeeptrackApplication.class, args);
	}

	@Bean
	public CommandLineRunner initializeDemoData(RoomRepository roomRepository, HousekeeperRepository housekeeperRepository) {
		return args -> {
			Map<String, RoomStatus> demoRooms = new LinkedHashMap<>();
			demoRooms.put("101", RoomStatus.READY);
			demoRooms.put("102", RoomStatus.DIRTY);
			demoRooms.put("103", RoomStatus.DIRTY);
			demoRooms.put("104", RoomStatus.READY);
			demoRooms.put("105", RoomStatus.DIRTY);

			Set<String> existingRoomNumbers = roomRepository.findAll().stream()
					.map(Room::getRoomNumber)
					.filter(Objects::nonNull)
					.collect(Collectors.toSet());
			for (Map.Entry<String, RoomStatus> entry : demoRooms.entrySet()) {
				if (existingRoomNumbers.add(entry.getKey())) {
					Room room = new Room();
					room.setRoomNumber(entry.getKey());
					room.setStatus(entry.getValue());
					roomRepository.save(room);
				}
			}

			Set<String> existingHousekeeperNames = housekeeperRepository.findAll().stream()
					.map(Housekeeper::getName)
					.filter(Objects::nonNull)
					.collect(Collectors.toSet());
			for (String name : List.of("Arun", "Kumar", "Priya", "Divya")) {
				if (existingHousekeeperNames.add(name)) {
					Housekeeper housekeeper = new Housekeeper();
					housekeeper.setName(name);
					housekeeper.setAvailable(true);
					housekeeperRepository.save(housekeeper);
				}
			}
		};
	}
}
