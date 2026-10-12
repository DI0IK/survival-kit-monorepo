export type TrackActionType =
    | "EXMATRICULATED"
    | "GAME_PLAYED"
    | "GAME_SUGGESTED"
    | "IDEA_SUBMITTED"
    | "LOGGED_IN"
    | "MEME_UPLOADED"
    | "PRESENTATION_GAME_PLAYED"
    | "ROOMS_SEARCHED";

export type TrackAction = {
    id: string,
    type: TrackActionType,
    userIdIfUser: string,
    courseIfUser: string,
    timestamp: string
}
