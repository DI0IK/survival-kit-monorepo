import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark, mergeAttributes } from "@tiptap/core";
import { useCallback } from "react";
import "@/components/ui/RichTextEditor.css";

type TextSizeValue = "h1" | "h2";

const TextSize = Mark.create({
    name: "textSize",
    addAttributes() {
        return {
            size: {
                default: "h1",
                parseHTML: (element: HTMLElement) => {
                    const declared = element.getAttribute("data-size");
                    if (declared === "h1" || declared === "h2") return declared;
                    const tag = element.tagName.toLowerCase();
                    if (tag === "h4" || element.classList.contains("rte-h2")) return "h2";
                    return "h1";
                },
                renderHTML: (attributes) => ({
                    "data-size": attributes.size,
                    class: attributes.size === "h2" ? "rte-h2" : "rte-h1",
                }),
            },
        };
    },
    parseHTML() {
        return [
            { tag: "span.rte-h1" },
            { tag: "span.rte-h2" },
            { tag: "h1" },
            { tag: "h2" },
            { tag: "h3" },
            { tag: "h4" },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["span", mergeAttributes(HTMLAttributes), 0];
    },
});

const Underline = Mark.create({
    name: "underline",
    parseHTML() {
        return [
            { tag: "u" },
            { style: "text-decoration=underline" },
        ];
    },
    renderHTML() {
        return ["u", 0];
    },
});

const Important = Mark.create({
    name: "important",
    parseHTML() {
        return [
            { tag: "span.important-text" },
            { tag: "a.important-text" },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["span", mergeAttributes(HTMLAttributes, { class: "important-text" }), 0];
    },
});

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            className={`rte-toolbar-btn${active ? " rte-toolbar-btn--active" : ""}`}
        >
            {children}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    const setLink = useCallback(() => {
        const url = window.prompt("URL eingeben:", "https://");
        if (!url) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
    }, [editor]);

    const setTextSize = (size: TextSizeValue) => {
        const selectionIsEmpty = editor.state.selection.empty;
        const chain = editor.chain().focus();
        if (selectionIsEmpty && editor.isActive("textSize")) {
            chain.extendMarkRange("textSize");
        }
        if (editor.isActive("textSize", { size })) {
            chain.unsetMark("textSize").run();
            return;
        }
        chain.setMark("textSize", { size }).run();
    };

    const setBodyText = () => {
        const chain = editor.chain().focus();
        if (editor.state.selection.empty && editor.isActive("textSize")) {
            chain.extendMarkRange("textSize");
        }
        chain.unsetMark("textSize").run();
    };

    return (
        <div className="rte-toolbar">
            <div className="rte-toolbar-group">
                <ToolbarButton
                    onClick={setBodyText}
                    active={!editor.isActive("textSize")}
                    title="Text"
                >
                    Text
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => setTextSize("h1")}
                    active={editor.isActive("textSize", { size: "h1" })}
                    title="Überschrift"
                >
                    H1
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => setTextSize("h2")}
                    active={editor.isActive("textSize", { size: "h2" })}
                    title="Unterüberschrift"
                >
                    H2
                </ToolbarButton>
            </div>

            <div className="rte-toolbar-divider" />

            <div className="rte-toolbar-group">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Fett"
                >
                    <b>B</b>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Kursiv"
                >
                    <i>I</i>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleMark("underline").run()}
                    active={editor.isActive("underline")}
                    title="Unterstrichen"
                >
                    <u>U</u>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleMark("important").run()}
                    active={editor.isActive("important")}
                    title="Wichtig"
                >
                    <span className="rte-important-icon">!</span>
                </ToolbarButton>
            </div>

            <div className="rte-toolbar-divider" />

            <div className="rte-toolbar-group">
                <ToolbarButton
                    onClick={setLink}
                    active={editor.isActive("link")}
                    title="Link einfügen"
                >
                    🔗
                </ToolbarButton>
                {editor.isActive("link") && (
                    <ToolbarButton
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        title="Link entfernen"
                    >
                        ✕
                    </ToolbarButton>
                )}
            </div>
        </div>
    );
}

interface RichTextEditorProps {
    value?: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Beschreibung eingeben…" }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                blockquote: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                code: false,
                codeBlock: false,
                horizontalRule: false,
                strike: false,
                heading: false,
            }),
            TextSize,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "rte-link",
                    rel: "noopener noreferrer",
                    target: "_blank",
                },
                autolink: true,
            }),
            Important,
            Placeholder.configure({ placeholder }),
        ],
        content: value ?? "",
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "rte-content",
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="form-group">
            <label>Beschreibung</label>
            <div className="rte-wrapper">
                <Toolbar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}