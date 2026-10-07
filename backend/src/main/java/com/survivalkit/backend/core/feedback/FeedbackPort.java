package com.survivalkit.backend.core.feedback;

import com.survivalkit.backend.adapter.postgres.feedback.AnsweredFeedbackNotice;
import com.survivalkit.backend.adapter.postgres.feedback.Feedback;
import com.survivalkit.backend.shared.Page;

import java.util.List;

public interface FeedbackPort {
    void saveFeedback(String title, String description, Feedback.FeedbackType type);
    Page<Feedback> getFeedbackPaged(Integer pageSize, String continuation);
    void rateFeedback(String id, Boolean upVote);
    void deleteFeedback(String id);
    void answerFeedback(String id, String answer);
    boolean hasVoted(String id);
    List<AnsweredFeedbackNotice> answeredFeedback();

}
