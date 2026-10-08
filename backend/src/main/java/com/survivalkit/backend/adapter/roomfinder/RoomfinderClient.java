package com.survivalkit.backend.adapter.roomfinder;

import com.survivalkit.backend.core.roomfinder.RoomAvailability;
import com.survivalkit.backend.core.roomfinder.RoomDaySchedule;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface RoomfinderClient {

    UpstreamFreeRooms findFreeRooms(LocalDateTime from, LocalDateTime to, String near, int limit);

    RoomAvailability checkRoom(String room, LocalDateTime from, LocalDateTime to);

    RoomDaySchedule busySlots(String room, LocalDate date);
}
