package com.survivalkit.backend.adapter.postgres.activity;

import java.util.List;

public interface UserActivityPersistancePort {

    void save(UserActivity activity);

    List<UserActivity> findByUser(String userId);
}
