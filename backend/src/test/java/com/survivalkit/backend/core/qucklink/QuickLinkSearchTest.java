package com.survivalkit.backend.core.qucklink;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QuickLinkSearchTest {

    @Test
    void matchesTitleIgnoringCaseAndSpaces() {
        assertTrue(QuickLinkSearch.matches("Mine Craft Classic", "A sandbox game", "  minecraft  "));
        assertTrue(QuickLinkSearch.matches("Slither.io", "Multiplayer snake", "SLITHER"));
    }

    @Test
    void matchesDescriptionIgnoringCaseAndSpaces() {
        assertTrue(QuickLinkSearch.matches("Paper.io", "Grow your territory", "your territory"));
        assertFalse(QuickLinkSearch.matches("Paper.io", "Grow your territory", "chess"));
    }

    @Test
    void matchesSingleCharacterTyposWithLevenshtein() {
        assertTrue(QuickLinkSearch.matches("Minecraft", "Build and explore", "minecrft"));
        assertTrue(QuickLinkSearch.matches("Slither.io", "Snake game", "slitheri"));
    }

    @Test
    void keepsShortQueriesExactAfterNormalization() {
        assertTrue(QuickLinkSearch.matches("Minecraft", "Build", "mine"));
        assertFalse(QuickLinkSearch.matches("Minecraft", "Build", "minf"));
    }
}
