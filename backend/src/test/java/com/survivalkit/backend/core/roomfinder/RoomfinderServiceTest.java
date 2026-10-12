package com.survivalkit.backend.core.roomfinder;

import com.survivalkit.backend.adapter.postgres.usetracking.TrackAction;
import com.survivalkit.backend.adapter.roomfinder.RoomfinderClient;
import com.survivalkit.backend.adapter.roomfinder.UpstreamFreeRooms;
import com.survivalkit.backend.adapter.web.ErrorCode;
import com.survivalkit.backend.core.statistics.StatisticsPort;
import com.survivalkit.backend.shared.Page;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RoomfinderServiceTest {

    @Test
    void pagesFreeRoomsInStepsOfTwenty() {
        var client = new FakeClient(25);
        var service = new RoomfinderService(client, stats());

        var first = service.findFreeRooms("2026-10-08", "09:00", "11:00", "a171", null);

        assertEquals(21, client.lastLimit);
        assertEquals("A171", client.lastNear);
        assertEquals(20, first.data().size());
        assertEquals("A100", first.data().getFirst().room());
        assertEquals("20", first.continuation());
        assertEquals(10, first.fromUnix());

        var second = service.findFreeRooms("2026-10-08", "09:00", null, null, first.continuation());

        assertEquals(41, client.lastLimit);
        assertNull(client.lastNear);
        assertEquals(5, second.data().size());
        assertEquals("A120", second.data().getFirst().room());
        assertNull(second.continuation());
    }

    @Test
    void rejectsAnEndTimeThatIsNotAfterTheStart() {
        var service = new RoomfinderService(new FakeClient(0), stats());

        var error = assertThrows(IllegalArgumentException.class, () ->
                service.findFreeRooms("2026-10-08", "11:00", "09:00", null, null)
        );

        assertEquals(ErrorCode.ROOMFINDER_INVALID_QUERY.getCode(), error.getMessage());
    }

    @Test
    void rejectsARoomNameTheUpstreamCannotParse() {
        var service = new RoomfinderService(new FakeClient(0), stats());

        var error = assertThrows(IllegalArgumentException.class, () ->
                service.checkRoom("lecture-hall", "2026-10-08", "09:00", null)
        );

        assertEquals(ErrorCode.ROOMFINDER_INVALID_QUERY.getCode(), error.getMessage());
    }

    private static StatisticsPort stats() {
        return new StatisticsPort() {
            @Override
            public void saveTrackAction(TrackAction.Action action) {
            }

            @Override
            public Page<TrackAction> getUserActions(TrackAction.Action actionType, String continuation) {
                return new Page<>(List.of(), null);
            }

            @Override
            public Page<TrackAction> getCourseActions(TrackAction.Action actionType, String continuation) {
                return new Page<>(List.of(), null);
            }

            @Override
            public Page<TrackAction> getGlobalActions(TrackAction.Action actionType, String continuation) {
                return new Page<>(List.of(), null);
            }

            @Override
            public int getActionSumForUser(TrackAction.Action target) {
                return 0;
            }

            @Override
            public int getActionSumForCourse(TrackAction.Action target) {
                return 0;
            }

            @Override
            public int getGolbalActionSum(TrackAction.Action target) {
                return 0;
            }
        };
    }

    private static final class FakeClient implements RoomfinderClient {
        private final int available;
        private int lastLimit;
        private String lastNear;

        private FakeClient(int available) {
            this.available = available;
        }

        @Override
        public UpstreamFreeRooms findFreeRooms(LocalDateTime from, LocalDateTime to, String near, int limit) {
            lastLimit = limit;
            lastNear = near;
            var count = Math.min(limit, available);
            var rooms = new ArrayList<FreeRoom>();
            for (var i = 0; i < count; i++) {
                rooms.add(new FreeRoom("A" + (100 + i), i));
            }
            return new UpstreamFreeRooms(10, 20, rooms);
        }

        @Override
        public RoomAvailability checkRoom(String room, LocalDateTime from, LocalDateTime to) {
            return new RoomAvailability(room, true, 10, 20, List.of());
        }

        @Override
        public RoomDaySchedule busySlots(String room, LocalDate date) {
            return new RoomDaySchedule(room, date.toString(), List.of());
        }
    }
}
