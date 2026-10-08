package com.survivalkit.backend.core.roomfinder;

import com.survivalkit.backend.adapter.roomfinder.RoomfinderClient;
import com.survivalkit.backend.adapter.web.ErrorCode;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class RoomfinderService implements RoomfinderPort {

    static final int PAGE_SIZE = 20;
    private static final int MAX_OFFSET = 500;
    private static final Pattern ROOM = Pattern.compile("^[A-Za-z]\\d{2,}$");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("H:mm");

    private final RoomfinderClient roomfinderClient;

    public RoomfinderService(RoomfinderClient roomfinderClient) {
        this.roomfinderClient = roomfinderClient;
    }

    @Override
    public FreeRoomsPage findFreeRooms(String date, String time, String endTime, String near, String continuation) {
        var window = window(date, time, endTime);
        var offset = offset(continuation);
        var nearRoom = optionalRoom(near);
        var fetched = roomfinderClient.findFreeRooms(window.from(), window.to(), nearRoom, offset + PAGE_SIZE + 1);
        var rooms = fetched.rooms();
        var fromIndex = Math.min(offset, rooms.size());
        var toIndex = Math.min(fromIndex + PAGE_SIZE, rooms.size());
        var page = List.copyOf(rooms.subList(fromIndex, toIndex));
        var next = rooms.size() > offset + PAGE_SIZE ? Integer.toString(offset + PAGE_SIZE) : null;
        return new FreeRoomsPage(page, next, fetched.fromUnix(), fetched.toUnix());
    }

    @Override
    public RoomAvailability checkRoom(String room, String date, String time, String endTime) {
        var window = window(date, time, endTime);
        return roomfinderClient.checkRoom(requiredRoom(room), window.from(), window.to());
    }

    @Override
    public RoomDaySchedule busySlots(String room, String date) {
        return roomfinderClient.busySlots(requiredRoom(room), parseDate(date));
    }

    private Window window(String date, String time, String endTime) {
        var start = LocalDateTime.of(parseDate(date), parseTime(time));
        LocalDateTime end;
        if (endTime == null || endTime.isBlank()) {
            end = start.plusHours(2);
        } else {
            end = LocalDateTime.of(start.toLocalDate(), parseTime(endTime));
            if (!end.isAfter(start)) {
                throw invalid();
            }
        }
        return new Window(start, end);
    }

    private int offset(String continuation) {
        if (continuation == null || continuation.isBlank()) {
            return 0;
        }
        try {
            var value = Integer.parseInt(continuation);
            if (value < 0 || value > MAX_OFFSET) {
                throw invalid();
            }
            return value;
        } catch (NumberFormatException exception) {
            throw invalid();
        }
    }

    private String optionalRoom(String room) {
        if (room == null || room.isBlank()) {
            return null;
        }
        return requiredRoom(room);
    }

    private String requiredRoom(String room) {
        if (room == null || !ROOM.matcher(room.trim()).matches()) {
            throw invalid();
        }
        return room.trim().toUpperCase(Locale.ROOT);
    }

    private LocalDate parseDate(String date) {
        if (date == null || date.isBlank()) {
            throw invalid();
        }
        try {
            return LocalDate.parse(date);
        } catch (DateTimeException exception) {
            throw invalid();
        }
    }

    private LocalTime parseTime(String time) {
        if (time == null || time.isBlank()) {
            throw invalid();
        }
        try {
            return LocalTime.parse(time, TIME);
        } catch (DateTimeException exception) {
            throw invalid();
        }
    }

    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException(ErrorCode.ROOMFINDER_INVALID_QUERY.getCode());
    }

    private record Window(LocalDateTime from, LocalDateTime to) {}
}
