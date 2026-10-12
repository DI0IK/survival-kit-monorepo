package com.survivalkit.backend.adapter.web.activity;

import com.survivalkit.backend.adapter.postgres.activity.UserActivity;
import com.survivalkit.backend.core.activity.ActivityPort;
import com.survivalkit.backend.shared.Role;
import com.survivalkit.backend.shared.RoleLevel;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Activities")
@RestController
@RequestMapping("v1/activities")
public class ActivityController {

    private final ActivityPort activityPort;

    public ActivityController(ActivityPort activityPort) {
        this.activityPort = activityPort;
    }

    @Role(RoleLevel.USER)
    @GetMapping
    public ResponseEntity<List<UserActivity>> listMine() {
        return ResponseEntity.ok(activityPort.listMine());
    }
}
