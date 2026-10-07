package com.survivalkit.backend.adapter.postgres.widget;

import io.viascom.nanoid.NanoId;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Repository
public class UserWidgetRepository implements UserWidgetPersistancePort {

    private final JdbcClient jdbcClient;

    public UserWidgetRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public List<UserWidgetModel> getAllForUser(String userId) {
        return jdbcClient.sql(Statements.GET_ALL_FOR_USER.sql)
                .paramSource(new MapSqlParameterSource("userId", userId))
                .query(UserWidgetModel.class).list();
    }

    @Transactional
    @Override
    public void overrideAll(List<UserWidgetModel> userWidgets, String userId) {
        var existingById = getAllForUser(userId).stream()
                .collect(Collectors.toMap(UserWidgetModel::id, Function.identity()));
        var keptIds = new HashSet<String>();

        userWidgets.stream()
                .filter(widget -> widget.type() != UserWidgetModel.WidgetType.EMPTY)
                .forEach(widget -> {
                    var current = widget.id() == null ? null : existingById.get(widget.id());
                    if (current != null) {
                        jdbcClient.sql(Statements.UPDATE_LAYOUT.sql)
                                .paramSource(new MapSqlParameterSource("id", current.id())
                                        .addValue("userId", userId)
                                        .addValue("x", widget.x())
                                        .addValue("y", widget.y())
                                        .addValue("width", widget.width())
                                        .addValue("height", widget.height()))
                                .update();
                        keptIds.add(current.id());
                        return;
                    }

                    var id = widget.id();
                    if (id == null || id.isBlank() || idTaken(id)) {
                        id = NanoId.generate(25);
                    }
                    jdbcClient.sql(Statements.INSERT.sql)
                            .paramSource(new MapSqlParameterSource("id", id)
                                    .addValue("userId", userId)
                                    .addValue("type", widget.type().toString())
                                    .addValue("x", widget.x())
                                    .addValue("y", widget.y())
                                    .addValue("width", widget.width())
                                    .addValue("height", widget.height())
                                    .addValue("data", widget.data() == null ? "" : widget.data()))
                            .update();
                    keptIds.add(id);
                });

        existingById.keySet().stream()
                .filter(id -> !keptIds.contains(id))
                .forEach(id -> jdbcClient.sql(Statements.DELETE_ONE.sql)
                        .paramSource(new MapSqlParameterSource("id", id)
                                .addValue("userId", userId))
                        .update());
    }

    private boolean idTaken(String id) {
        return jdbcClient.sql(Statements.ID_EXISTS.sql)
                .param("id", id)
                .query(String.class)
                .optional()
                .isPresent();
    }

    @Override
    public boolean saveDataForWidget(String id, String userId, String data) {
        int updated = jdbcClient.sql(Statements.UPDATE_DATA.sql)
                .paramSource(new MapSqlParameterSource("id", id)
                        .addValue("userId", userId)
                        .addValue("data", data))
                .update();
        return updated > 0;
    }

    private enum Statements {
        // language=sql
        GET_ALL_FOR_USER(
        """
            SELECT id, type, x, y, width, height, data FROM userWidgets WHERE userId = :userId
            """
        ),
        // language=sql
        DELETE_ONE(
        """
            DELETE FROM userWidgets WHERE id = :id AND userId = :userId
            """
        ),
        // language=sql
        UPDATE_LAYOUT(
        """
            UPDATE userWidgets
            SET x = :x, y = :y, width = :width, height = :height
            WHERE id = :id AND userId = :userId
            """
        ),
        // language=sql
        ID_EXISTS(
        """
            SELECT id FROM userWidgets WHERE id = :id
            """
        ),
        // language=sql
        INSERT(
    """
        INSERT INTO userWidgets (id, userId, type, x, y, width, height, data)
        VALUES (:id, :userId, :type, :x, :y, :width, :height, :data)
        """
        ),
        // language=sql
        UPDATE_DATA(
                """
                    UPDATE userWidgets SET data = :data
                    WHERE id = :id AND userId = :userId
                    """
        );

        private String sql;

        Statements(String sql) {
            this.sql = sql;
        }
    }
}
