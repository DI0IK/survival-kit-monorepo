package com.survivalkit.backend.adapter.web.roomfinder;

import com.survivalkit.backend.core.roomfinder.FreeRoomsPage;
import com.survivalkit.backend.core.roomfinder.RoomAvailability;
import com.survivalkit.backend.core.roomfinder.RoomDaySchedule;
import com.survivalkit.backend.core.roomfinder.RoomfinderPort;
import com.survivalkit.backend.shared.Role;
import com.survivalkit.backend.shared.RoleLevel;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Roomfinder")
@RestController
@RequestMapping("v1/roomfinder")
public class RoomfinderController {

    private final RoomfinderPort roomfinderPort;

    public RoomfinderController(RoomfinderPort roomfinderPort) {
        this.roomfinderPort = roomfinderPort;
    }

    @Role(RoleLevel.GUEST)
    @GetMapping("/rooms/free")
    public ResponseEntity<FreeRoomsPage> findFreeRooms(
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) String near,
            @RequestParam(required = false) String continuation
    ) {
        return ResponseEntity.ok(roomfinderPort.findFreeRooms(date, time, endTime, near, continuation));
    }

    @Role(RoleLevel.GUEST)
    @GetMapping("/rooms/{room}/free")
    public ResponseEntity<RoomAvailability> checkRoom(
            @PathVariable String room,
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam(required = false) String endTime
    ) {
        return ResponseEntity.ok(roomfinderPort.checkRoom(room, date, time, endTime));
    }

    @Role(RoleLevel.GUEST)
    @GetMapping("/rooms/{room}/busy")
    public ResponseEntity<RoomDaySchedule> busySlots(
            @PathVariable String room,
            @RequestParam String date
    ) {
        return ResponseEntity.ok(roomfinderPort.busySlots(room, date));
    }
}
