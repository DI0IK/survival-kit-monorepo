package com.survivalkit.backend.core.roomfinder;

public interface RoomfinderPort {

    FreeRoomsPage findFreeRooms(String date, String time, String endTime, String near, String continuation);

    RoomAvailability checkRoom(String room, String date, String time, String endTime);

    RoomDaySchedule busySlots(String room, String date);
}
