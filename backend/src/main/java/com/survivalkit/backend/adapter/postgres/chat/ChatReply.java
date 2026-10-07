package com.survivalkit.backend.adapter.postgres.chat;

public record ChatReply(
        String messageId,
        String authorUserId,
        String authorUsername,
        String authorColor,
        String text
) {
}
