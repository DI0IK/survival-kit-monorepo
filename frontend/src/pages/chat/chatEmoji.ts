import data from "@emoji-mart/data";
import type {EmojiMartData} from "@emoji-mart/data";

const dataset = data as EmojiMartData;

const shortcodes = new Map<string, string>();

for (const emoji of Object.values(dataset.emojis)) {
    const native = emoji.skins[0]?.native;
    if (native) {
        shortcodes.set(emoji.id, native);
    }
}

for (const [alias, id] of Object.entries(dataset.aliases)) {
    const native = shortcodes.get(id);
    if (native) {
        shortcodes.set(alias, native);
    }
}

type Shortcut = {
    token: string;
    emoji: string;
    needsSpace: boolean;
};

// Longer tokens first so :-) is not eaten by :).
const SHORTCUTS: Shortcut[] = [
    {token: "</3", emoji: "💔", needsSpace: false},
    {token: ">:(", emoji: "😠", needsSpace: false},
    {token: ">:-(", emoji: "😠", needsSpace: false},
    {token: ">:)", emoji: "😈", needsSpace: false},
    {token: ":'(", emoji: "😢", needsSpace: false},
    {token: ":')", emoji: "😂", needsSpace: false},
    {token: ":-)", emoji: "🙂", needsSpace: false},
    {token: ":)", emoji: "🙂", needsSpace: false},
    {token: ":-(", emoji: "🙁", needsSpace: false},
    {token: ":(", emoji: "🙁", needsSpace: false},
    {token: ":-D", emoji: "😃", needsSpace: false},
    {token: ":D", emoji: "😃", needsSpace: false},
    {token: ";-)", emoji: "😉", needsSpace: false},
    {token: ";)", emoji: "😉", needsSpace: false},
    {token: ":-P", emoji: "😛", needsSpace: false},
    {token: ":P", emoji: "😛", needsSpace: false},
    {token: ":-O", emoji: "😮", needsSpace: false},
    {token: ":O", emoji: "😮", needsSpace: false},
    {token: ":-/", emoji: "😕", needsSpace: false},
    {token: ":/", emoji: "😕", needsSpace: false},
    {token: ":-|", emoji: "😐", needsSpace: false},
    {token: ":|", emoji: "😐", needsSpace: false},
    {token: ":-*", emoji: "😘", needsSpace: false},
    {token: ":*", emoji: "😘", needsSpace: false},
    {token: "xD", emoji: "😆", needsSpace: false},
    {token: "XD", emoji: "😆", needsSpace: false},
    {token: "B)", emoji: "😎", needsSpace: false},
    {token: ":-p", emoji: "😛", needsSpace: true},
    {token: ":p", emoji: "😛", needsSpace: true},
    {token: ":-o", emoji: "😮", needsSpace: true},
    {token: ":o", emoji: "😮", needsSpace: true},
];

const boundaryBefore = (text: string, index: number) =>
    index === 0 || /[\s([{"']/.test(text[index - 1]);

export const emojiMartData = dataset;

export const expandEmojiNotation = (text: string): string => {
    let result = "";
    let index = 0;

    while (index < text.length) {
        if (boundaryBefore(text, index)) {
            const rest = text.slice(index);
            const shortcode = /^:([a-z0-9_+-]+):/.exec(rest);
            if (shortcode) {
                const emoji = shortcodes.get(shortcode[1]);
                if (emoji) {
                    result += emoji;
                    index += shortcode[0].length;
                    continue;
                }
            }

            let replaced = false;
            for (const shortcut of SHORTCUTS) {
                if (!rest.startsWith(shortcut.token)) {
                    continue;
                }
                const next = text[index + shortcut.token.length];
                if (shortcut.needsSpace && next !== " " && next !== "\n") {
                    continue;
                }
                result += shortcut.emoji;
                index += shortcut.token.length;
                replaced = true;
                break;
            }
            if (replaced) {
                continue;
            }
        }

        result += text[index];
        index += 1;
    }

    return result;
};

export const applyEmojiShortcuts = (value: string, cursor: number) => {
    const before = expandEmojiNotation(value.slice(0, cursor));
    const after = expandEmojiNotation(value.slice(cursor));
    return {value: before + after, cursor: before.length};
};
