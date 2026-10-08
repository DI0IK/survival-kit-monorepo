package com.survivalkit.backend.core.roomfinder;

import java.util.List;

public record RoomDaySchedule(String room, String date, List<BusySlot> busyDuring) {}
