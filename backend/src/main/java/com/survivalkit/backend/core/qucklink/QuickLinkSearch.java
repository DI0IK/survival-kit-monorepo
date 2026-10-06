package com.survivalkit.backend.core.qucklink;

import java.util.Locale;

public final class QuickLinkSearch {

    private static final int MAX_NEEDLE_LENGTH = 64;
    private static final int MAX_FUZZY_HAYSTACK_LENGTH = 2000;

    private QuickLinkSearch() {
    }

    public static String normalize(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        var folded = value.toLowerCase(Locale.ROOT);
        var normalized = new StringBuilder(folded.length());
        for (int i = 0; i < folded.length(); i++) {
            char character = folded.charAt(i);
            if (!Character.isWhitespace(character)) {
                normalized.append(character);
            }
        }
        return normalized.toString();
    }

    public static boolean matches(String title, String description, String query) {
        var needle = normalize(query);
        if (needle.isEmpty()) {
            return true;
        }
        if (needle.length() > MAX_NEEDLE_LENGTH) {
            needle = needle.substring(0, MAX_NEEDLE_LENGTH);
        }
        return fuzzyContains(normalize(title), needle) || fuzzyContains(normalize(description), needle);
    }

    static boolean fuzzyContains(String haystack, String needle) {
        if (needle.isEmpty()) {
            return true;
        }
        if (haystack.isEmpty()) {
            return false;
        }
        if (haystack.contains(needle)) {
            return true;
        }
        int maxDistance = maxDistance(needle.length());
        if (maxDistance == 0) {
            return false;
        }
        var scanned = haystack.length() > MAX_FUZZY_HAYSTACK_LENGTH
                ? haystack.substring(0, MAX_FUZZY_HAYSTACK_LENGTH)
                : haystack;
        int minLength = Math.max(1, needle.length() - maxDistance);
        int maxLength = Math.min(scanned.length(), needle.length() + maxDistance);
        if (maxLength < minLength) {
            return false;
        }
        var previous = new int[needle.length() + 1];
        var current = new int[needle.length() + 1];
        for (int length = minLength; length <= maxLength; length++) {
            int lastStart = scanned.length() - length;
            for (int start = 0; start <= lastStart; start++) {
                if (withinDistance(scanned, start, length, needle, maxDistance, previous, current)) {
                    return true;
                }
            }
        }
        return false;
    }

    static int maxDistance(int length) {
        if (length < 5) {
            return 0;
        }
        if (length < 8) {
            return 1;
        }
        return 2;
    }

    private static boolean withinDistance(
            String haystack,
            int start,
            int haystackLength,
            String needle,
            int maxDistance,
            int[] previous,
            int[] current
    ) {
        int needleLength = needle.length();
        if (Math.abs(haystackLength - needleLength) > maxDistance) {
            return false;
        }
        for (int column = 0; column <= needleLength; column++) {
            previous[column] = column;
        }
        for (int row = 1; row <= haystackLength; row++) {
            current[0] = row;
            int rowMinimum = current[0];
            char haystackChar = haystack.charAt(start + row - 1);
            for (int column = 1; column <= needleLength; column++) {
                int cost = haystackChar == needle.charAt(column - 1) ? 0 : 1;
                int inserted = current[column - 1] + 1;
                int deleted = previous[column] + 1;
                int replaced = previous[column - 1] + cost;
                int distance = Math.min(inserted, Math.min(deleted, replaced));
                current[column] = distance;
                if (distance < rowMinimum) {
                    rowMinimum = distance;
                }
            }
            if (rowMinimum > maxDistance) {
                return false;
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[needleLength] <= maxDistance;
    }
}
