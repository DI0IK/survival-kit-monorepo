package com.survivalkit.backend.core.feedback;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.survivalkit.backend.adapter.postgres.feedback.AnsweredFeedbackNotice;
import com.survivalkit.backend.adapter.postgres.feedback.Feedback;
import com.survivalkit.backend.adapter.postgres.feedback.FeedbackPersistancePort;
import com.survivalkit.backend.adapter.postgres.usetracking.TrackAction;
import com.survivalkit.backend.context.SecurityContext;
import com.survivalkit.backend.core.statistics.StatisticsPort;
import com.survivalkit.backend.core.websocket.WebSocketPort;
import com.survivalkit.backend.shared.Page;
import com.survivalkit.backend.shared.RoleLevel;
import com.survivalkit.backend.shared.WebSocketEnvelope;
import com.survivalkit.backend.shared.WebSocketMessageType;
import io.viascom.nanoid.NanoId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

import static com.survivalkit.backend.context.SecurityContext.requireVerification;

@Service
public class FeedbackService implements FeedbackPort {

    private final FeedbackPersistancePort feedbackPersistancePort;
    private final StatisticsPort statisticsPort;
    private final WebSocketPort webSocketPort;
    private final ObjectMapper objectMapper;

    public FeedbackService(
            FeedbackPersistancePort feedbackPersistancePort,
            StatisticsPort statisticsPort,
            WebSocketPort webSocketPort,
            ObjectMapper objectMapper
    ) {
        this.feedbackPersistancePort = feedbackPersistancePort;
		this.statisticsPort = statisticsPort;
        this.webSocketPort = webSocketPort;
        this.objectMapper = objectMapper;
    }

    @Override
    public void saveFeedback(String title, String description, Feedback.FeedbackType type) {
        var user = SecurityContext.currentOptional()
                .filter(current -> current.role().hasAtLeast(RoleLevel.USER))
                .orElse(null);
        if (user != null) {
            requireVerification();
        }

        var newFeedback = new Feedback(
            NanoId.generate(25),
                title,
                description,
                user == null ? "Gastbenutzer" : user.username(),
                user == null ? null : user.userId(),
                type,
                0,
                0,
                null,
                Instant.now(),
                Instant.now()
        );
        feedbackPersistancePort.saveFeedback(newFeedback);
        statisticsPort.saveTrackAction(TrackAction.Action.IDEA_SUBMITTED);
    }

    @Override
    public Page<Feedback> getFeedbackPaged(Integer pageSize, String continuation) {
        pageSize = pageSize == null ? 50 : pageSize;
        pageSize = pageSize > 50 ? 50 : pageSize;

        return feedbackPersistancePort.getFeedbackPaged(pageSize, continuation);
    }

    @Override
    public void rateFeedback(String feedbackId, Boolean upVote) {

        requireVerification();

        var user = SecurityContext.current();

        if (feedbackPersistancePort.canVote(feedbackId, user.userId())) {
            feedbackPersistancePort.rateFeedback(feedbackId, upVote, user.userId());
        }
    }

    @Override
    public void deleteFeedback(String feedbackId) {
        requireVerification();
        feedbackPersistancePort.deleteFeedback(feedbackId);
    }

    @Override
    public void answerFeedback(String id, String answer) {
        requireVerification();
        var authorUserId = feedbackPersistancePort.findAuthorUserId(id).orElse(null);
        feedbackPersistancePort.answerFeedback(id, answer);
        if (authorUserId == null || authorUserId.isBlank() || answer == null || answer.isBlank()) {
            return;
        }
        webSocketPort.sendToUser(
                authorUserId,
                WebSocketEnvelope.of(
                        WebSocketMessageType.ACTIVITY,
                        objectMapper.createObjectNode().put("kind", "FEEDBACK_ANSWERED").put("id", id)
                )
        );
    }

    @Override
    public boolean hasVoted(String id) {
        var user = SecurityContext.current();
        return !feedbackPersistancePort.canVote(id, user.userId());
    }

    @Override
    public List<AnsweredFeedbackNotice> answeredFeedback() {
        var user = SecurityContext.current();
        return feedbackPersistancePort.findAnsweredByUser(user.userId());
    }
}
