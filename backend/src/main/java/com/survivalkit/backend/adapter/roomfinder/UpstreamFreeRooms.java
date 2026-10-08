package com.survivalkit.backend.adapter.roomfinder;

import com.survivalkit.backend.core.roomfinder.FreeRoom;

import java.util.List;

public record UpstreamFreeRooms(long fromUnix, long toUnix, List<FreeRoom> rooms) {}
