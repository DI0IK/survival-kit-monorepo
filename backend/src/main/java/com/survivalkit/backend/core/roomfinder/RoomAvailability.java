package com.survivalkit.backend.core.roomfinder;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record RoomAvailability(
        String room,
        @JsonProperty("isFree") boolean free,
        long fromUnix,
        long toUnix,
        List<BusySlot> busyDuring
) {}
