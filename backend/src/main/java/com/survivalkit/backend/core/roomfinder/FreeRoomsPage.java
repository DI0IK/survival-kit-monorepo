package com.survivalkit.backend.core.roomfinder;

import java.util.List;

public record FreeRoomsPage(
        List<FreeRoom> data,
        String continuation,
        long fromUnix,
        long toUnix
) {}
