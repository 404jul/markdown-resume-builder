import { useEffect, useRef, useState } from "react";
import {
  Check,
  Bold,
  BookOpen,
  Columns2,
  Download,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  List,
  Minus,
  Moon,
  Palette,
  PenLine,
  Sun,
  Upload,
  ZoomIn,
  ZoomOut,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Shapes,
  Star,
} from "lucide-react";
import ResumeDocument, {
  GithubIcon,
  LinkedinIcon,
} from "./ResumeDocument.jsx";
import { ICON_NAMES, iconCompletionAt } from "./iconTokens.js";

const DOCUMENT_KEY = "resume-md:document";
const RESUME_THEME_KEY = "resume-md:resume-theme";
const APP_THEME_KEY = "resume-md:app-theme";
const PREVIEW_ZOOM_KEY = "resume-md:preview-zoom";

const RESUME_THEMES = [
  { id: "classic", name: "Classic", description: "Traditional serif" },
  { id: "modern", name: "Modern", description: "Clean blue accent" },
  { id: "compact", name: "Compact", description: "More content per page" },
];

const VIEWS = [
  { id: "write", name: "Write", icon: PenLine },
  { id: "split", name: "Split", icon: Columns2 },
  { id: "preview", name: "Preview", icon: Eye },
];

const ICON_LABELS = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  github: "GitHub",
  linkedin: "LinkedIn",
  star: "Star",
};

const ICON_COMPONENTS = {
  email: Mail,
  phone: Phone,
  location: MapPin,
  github: GithubIcon,
  linkedin: LinkedinIcon,
  star: Star,
};

const MARKDOWN_GUIDE = [
  ["# Name / ## Section / ### Entry", "Headings"],
  ["**bold**", "Bold text"],
  ["- achievement", "Bullet list"],
  ["  - supporting detail", "Nested bullet · Tab / Shift+Tab"],
  ["---", "Horizontal rule"],
  ["{github}", "Icon token"],
];

const DEFAULT_SOURCE = `# John Doe

{location} City, ST · {email} [john.doe@example.com](mailto:john.doe@example.com) · {phone} (555) 010-1234  
{github} [github.com/johndoe](https://github.com/johndoe) · {linkedin} [linkedin.com/in/johndoe](https://linkedin.com/in/johndoe)

---

## Summary

Product-minded software engineer with 7 years of experience building reliable web applications and straightforward tools that customers enjoy using.

## Experience

### Senior Software Engineer — Northstar Labs
*2022–Present · Remote*

- Reduced checkout latency by **38%** by removing duplicate service calls.
- Led a platform migration serving **2 million requests per day** with no customer downtime.
- Mentored four engineers and introduced lightweight architecture reviews.

### Software Engineer — Fieldwork
*2019–2022 · City, ST*

- Built self-service reporting used by 600 customer teams.
- Cut support tickets by **24%** through clearer validation and actionable error messages.

## Projects

### {star} Open Source Maintainer — Queuecheck

- Maintained a TypeScript job-monitoring tool with 1,800 GitHub stars.

## Education

### B.S. Computer Science — State University
*2015–2019*

## Skills

TypeScript, React, Node.js, PostgreSQL, AWS, system design, technical leadership
`;

function readStoredValue(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function resumeFileName(source) {
  const heading = source.match(/^#\s+(.+)$/m)?.[1] ?? "resume";
  return (
    heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "resume"
  );
}

function editorCaretPosition(editor) {
  const computed = getComputedStyle(editor);
  const mirror = document.createElement("div");

  for (let index = 0; index < computed.length; index += 1) {
    const property = computed[index];
    mirror.style.setProperty(property, computed.getPropertyValue(property));
  }

  mirror.style.position = "fixed";
  mirror.style.inset = "0 auto auto 0";
  mirror.style.visibility = "hidden";
  mirror.style.overflow = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.textContent = editor.value.slice(0, editor.selectionStart);

  const caret = document.createElement("span");
  caret.textContent = "\u200b";
  mirror.append(caret);
  document.body.append(mirror);

  const position = {
    left: caret.offsetLeft - editor.scrollLeft,
    top:
      caret.offsetTop +
      (Number.parseFloat(computed.lineHeight) || 24) -
      editor.scrollTop,
  };
  mirror.remove();
  return position;
}

export default function App() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const themeDialogRef = useRef(null);
  const docsDialogRef = useRef(null);
  const iconPickerRef = useRef(null);
  const previewStageRef = useRef(null);
  const [source, setSource] = useState(() =>
    readStoredValue(DOCUMENT_KEY, DEFAULT_SOURCE),
  );
  const [resumeTheme, setResumeTheme] = useState(() => {
    const storedTheme = readStoredValue(RESUME_THEME_KEY, "classic");
    return RESUME_THEMES.some(({ id }) => id === storedTheme)
      ? storedTheme
      : "classic";
  });
  const [appTheme, setAppTheme] = useState(() => {
    const storedTheme = readStoredValue(APP_THEME_KEY, "");
    if (storedTheme === "light" || storedTheme === "business") return storedTheme;
    return "business";
  });
  const [view, setView] = useState("split");
  const [saveStatus, setSaveStatus] = useState("Saved locally");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(() => {
    const storedZoom = Number(readStoredValue(PREVIEW_ZOOM_KEY, "1"));
    return Number.isFinite(storedZoom) &&
      storedZoom >= 0.5 &&
      storedZoom <= 2
      ? storedZoom
      : 1;
  });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconCompletion, setIconCompletion] = useState(null);
  const [activeIconIndex, setActiveIconIndex] = useState(0);
  const [iconMenuPosition, setIconMenuPosition] = useState({ left: 8, top: 8 });
  const selectedResumeTheme =
    RESUME_THEMES.find(({ id }) => id === resumeTheme) ?? RESUME_THEMES[0];
  const matchingIcons = iconCompletion?.names ?? [];

  useEffect(() => {
    if (!iconPickerOpen) return;

    function closeIconPicker(event) {
      if (!iconPickerRef.current?.contains(event.target)) {
        setIconPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeIconPicker);
    return () => document.removeEventListener("pointerdown", closeIconPicker);
  }, [iconPickerOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(DOCUMENT_KEY, source);
      setSaveStatus("Saved locally");
    } catch {
      setSaveStatus("Local saving unavailable");
    }
  }, [source]);

  useEffect(() => {
    try {
      localStorage.setItem(RESUME_THEME_KEY, resumeTheme);
    } catch {
      // The selected theme still works for this session.
    }
  }, [resumeTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_ZOOM_KEY, String(previewZoom));
    } catch {
      // The selected zoom still works for this session.
    }
  }, [previewZoom]);

  useEffect(() => {
    const preview = previewStageRef.current;
    if (!preview) return;

    function handleWheel(event) {
      if ((!event.metaKey && !event.ctrlKey) || event.deltaY === 0) return;

      event.preventDefault();
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? preview.clientHeight
            : 1;
      adjustPreviewZoom((-event.deltaY * unit) / 1000);
    }

    preview.addEventListener("wheel", handleWheel, { passive: false });
    return () => preview.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = appTheme;
    try {
      localStorage.setItem(APP_THEME_KEY, appTheme);
    } catch {
      // The selected app theme still works for this session.
    }
  }, [appTheme]);

  function insertText(prefix, suffix = "", placeholder = "") {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? source.length;
    const end = editor?.selectionEnd ?? source.length;
    const selected = source.slice(start, end);
    const content = selected || placeholder;
    const insertion = `${prefix}${content}${suffix}`;

    setSource(`${source.slice(0, start)}${insertion}${source.slice(end)}`);
    requestAnimationFrame(() => {
      if (!editor) return;
      editor.focus();
      if (selected) {
        const cursor = start + insertion.length;
        editor.setSelectionRange(cursor, cursor);
      } else {
        editor.setSelectionRange(
          start + prefix.length,
          start + prefix.length + placeholder.length,
        );
      }
    });
  }

  function insertBlock(block, selectedText = "") {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? source.length;
    const end = editor?.selectionEnd ?? source.length;
    const before = source.slice(0, start);
    const after = source.slice(end);
    const leading = before && !before.endsWith("\n\n")
      ? before.endsWith("\n") ? "\n" : "\n\n"
      : "";
    const trailing = after && !after.startsWith("\n\n")
      ? after.startsWith("\n") ? "\n" : "\n\n"
      : "";
    const insertion = `${leading}${block}${trailing}`;

    setSource(`${before}${insertion}${after}`);
    requestAnimationFrame(() => {
      if (!editor) return;
      editor.focus();
      const textStart = start + leading.length + block.indexOf(selectedText);
      if (selectedText) {
        editor.setSelectionRange(textStart, textStart + selectedText.length);
      } else {
        const cursor = start + insertion.length - trailing.length;
        editor.setSelectionRange(cursor, cursor);
      }
    });
  }

  function positionIconSuggestions(editor, count) {
    const caret = editorCaretPosition(editor);
    const menuWidth = 208;
    const menuHeight = Math.min(count * 32 + 8, 208);
    const left = Math.max(
      8,
      Math.min(caret.left, editor.clientWidth - menuWidth - 8),
    );
    const top = caret.top + menuHeight <= editor.clientHeight
      ? caret.top
      : Math.max(8, caret.top - menuHeight - 24);

    setIconMenuPosition({ left, top });
  }

  function syncIconCompletion(value, cursor, editor = editorRef.current) {
    const completion = iconCompletionAt(value, cursor);
    setIconCompletion(completion);
    setActiveIconIndex(0);
    if (!completion || !editor) return;

    requestAnimationFrame(() =>
      positionIconSuggestions(editor, completion.names.length),
    );
  }

  function completeIcon(name) {
    const editor = editorRef.current;
    if (!editor || !iconCompletion) return;

    const token = `{${name}}`;
    const cursor = editor.selectionStart;
    const nextSource =
      editor.value.slice(0, iconCompletion.start) +
      token +
      editor.value.slice(cursor);
    const nextCursor = iconCompletion.start + token.length;

    setSaveStatus("Saving…");
    setSource(nextSource);
    setIconCompletion(null);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function changeEditorIndent(editor, outdent) {
    const value = editor.value;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selectionEnd =
      end > start && value[end - 1] === "\n" ? end - 1 : end;
    const nextLine = value.indexOf("\n", selectionEnd);
    const lineEnd = nextLine === -1 ? value.length : nextLine;
    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const nextLines = lines.map((line) =>
      outdent ? line.replace(/^(?: {1,2}|\t)/, "") : `  ${line}`,
    );
    const nextBlock = nextLines.join("\n");
    if (nextBlock === block) return;

    setSaveStatus("Saving…");
    setSource(
      `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`,
    );
    setIconCompletion(null);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(
        start + nextLines[0].length - lines[0].length,
        end + nextBlock.length - block.length,
      );
    });
  }

  function handleEditorKeyDown(event) {
    if (
      event.key === "Tab" &&
      (event.shiftKey || !iconCompletion || matchingIcons.length === 0)
    ) {
      event.preventDefault();
      changeEditorIndent(event.currentTarget, event.shiftKey);
      return;
    }

    if (!iconCompletion || matchingIcons.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIconIndex((index) => (index + 1) % matchingIcons.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIconIndex(
          (index) => (index - 1 + matchingIcons.length) % matchingIcons.length,
        );
        break;
      case "Enter":
      case "Tab":
        event.preventDefault();
        completeIcon(matchingIcons[activeIconIndex]);
        break;
      case "Escape":
        event.preventDefault();
        setIconCompletion(null);
        break;
    }
  }

  async function importMarkdown(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setSource(await file.text());
      setSaveStatus(`Opened ${file.name}`);
    } catch {
      setSaveStatus("Could not open that file");
    } finally {
      input.value = "";
    }
  }

  function downloadMarkdown() {
    const url = URL.createObjectURL(
      new Blob([source], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resumeFileName(source)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function startOver() {
    const confirmed = window.confirm(
      "Start over with the starter template? Your current local draft will be replaced.",
    );
    if (!confirmed) return;

    setSource(DEFAULT_SOURCE);
    setSaveStatus("Saved locally");
    setIconCompletion(null);
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      editor?.focus();
      editor?.setSelectionRange(0, 0);
    });
  }

  async function exportPdf() {
    const resume = document.querySelector(
      ".preview-page-zoom > .resume-page",
    );
    if (!resume || exportingPdf) return;

    const exportPage = resume.cloneNode(true);
    exportPage.classList.add("pdf-export-page");

    // dompdf trims normal-space edges from separate inline text runs.
    const textWalker = document.createTreeWalker(
      exportPage,
      NodeFilter.SHOW_TEXT,
    );
    let textNode = textWalker.nextNode();
    while (textNode) {
      textNode.data = textNode.data.replace(/^ +| +$/g, "\u00a0");
      textNode = textWalker.nextNode();
    }

    for (const heading of Array.from(exportPage.querySelectorAll("h3"))) {
      const entry = document.createElement("div");
      entry.className = "pdf-export-entry";
      entry.setAttribute("divisionDisable", "");
      heading.before(entry);

      let sibling = heading.nextSibling;
      entry.append(heading);
      while (
        sibling &&
        !(sibling instanceof Element && /^H[1-6]$/.test(sibling.tagName))
      ) {
        const next = sibling.nextSibling;
        entry.append(sibling);
        sibling = next;
      }
    }

    for (const list of exportPage.querySelectorAll("ul, ol")) {
      const ordered = list.tagName === "OL";
      const start = ordered ? Number(list.getAttribute("start") ?? 1) : 1;

      Array.from(list.children).forEach((item, index) => {
        if (item.tagName !== "LI") return;

        const marker = document.createElement("span");
        marker.className = "pdf-list-marker";
        marker.textContent = ordered ? `${start + index}.` : "•";

        const content = document.createElement("div");
        content.className = "pdf-list-content";
        content.append(...item.childNodes);

        item.classList.add("pdf-list-item");
        item.setAttribute("divisionDisable", "");
        item.append(marker, content);
      });
    }
    document.body.append(exportPage);
    const exportTop = exportPage.getBoundingClientRect().top;
    const pageBodyHeight = (11 - 0.52 * 2) * 96;
    let pageTop = 0;

    for (const entry of exportPage.querySelectorAll(".pdf-export-entry")) {
      const bounds = entry.getBoundingClientRect();
      const top = bounds.top - exportTop;
      const bottom = bounds.bottom - exportTop;

      if (top > pageTop && bottom - pageTop > pageBodyHeight) {
        entry.setAttribute("pageBreak", "");
        pageTop = top;
      }
    }
    setExportingPdf(true);

    try {
      const { downloadPDF } = await import("dompdf.js");
      await document.fonts.ready;
      await downloadPDF(
        exportPage,
        {
          backgroundColor: "#fff",
          compress: true,
          format: "letter",
          marginPt: [0, 46.8, 0, 46.8],
          pageConfig: {
            header: { content: "", height: 37.44 },
            footer: { content: "", height: 37.44 },
          },
          pagination: true,
        },
        `${resumeFileName(source)}.pdf`,
      );
      setSaveStatus("Saved locally");
    } catch (error) {
      console.error("PDF export failed", error);
      setSaveStatus("PDF export failed");
    } finally {
      exportPage.remove();
      setExportingPdf(false);
    }
  }

  function adjustPreviewZoom(change) {
    setPreviewZoom((current) =>
      Math.min(2, Math.max(0.5, Number((current + change).toFixed(3)))),
    );
  }

  function handlePreviewKeyDown(event) {
    if (!event.metaKey && !event.ctrlKey) return;

    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault();
        adjustPreviewZoom(0.1);
        break;
      case "-":
      case "_":
        event.preventDefault();
        adjustPreviewZoom(-0.1);
        break;
      case "0":
        event.preventDefault();
        setPreviewZoom(1);
        break;
    }
  }

  return (
    <div className="app-shell min-h-screen bg-base-200 text-base-content">
      <header className="app-header border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div className="navbar app-navbar min-h-16 flex-nowrap gap-3 px-3 md:px-5">
          <div className="flex shrink-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral font-mono text-sm font-black text-neutral-content">
              R.
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight">Resume.md</h1>
                <span className="badge badge-ghost badge-sm hidden xl:inline-flex">local-first</span>
              </div>
              <p className="hidden truncate text-xs text-base-content/55 lg:block">ATS-friendly Markdown to PDF</p>
            </div>
          </div>

          <div className="app-navbar-tools flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <div aria-label="Editor view" className="join shrink-0 overflow-hidden rounded-field bg-base-200" role="tablist">
              {VIEWS.map(({ id, name, icon: Icon }) => (
                <button
                  aria-selected={view === id}
                  className={`join-item btn btn-ghost btn-sm gap-1.5 ${view === id ? "btn-active" : ""}`}
                  key={id}
                  onClick={() => setView(id)}
                  role="tab"
                  type="button"
                >
                  <Icon size={15} />
                  <span className="hidden lg:inline">{name}</span>
                </button>
              ))}
            </div>

            <button
              aria-haspopup="dialog"
              className="btn btn-ghost btn-sm shrink-0 gap-1.5"
              onClick={() => themeDialogRef.current?.showModal()}
              type="button"
            >
              <Palette size={16} />
              <span>Theme</span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 text-xs text-base-content/50 xl:flex">
              <span className={`status status-xs ${saveStatus === "Saved locally" ? "status-success" : "status-warning"}`} />
              {saveStatus}
            </span>

            <input
              accept=".md,.markdown,text/markdown,text/plain"
              className="hidden"
              onChange={importMarkdown}
              ref={fileInputRef}
              type="file"
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Open a Markdown file"
              type="button"
            >
              <Upload size={16} />
              <span className="hidden lg:inline">Open</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={startOver}
              title="Start over with the starter template"
              type="button"
            >
              <RotateCcw size={16} />
              <span className="hidden xl:inline">Start over</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={downloadMarkdown}
              title="Download Markdown"
              type="button"
            >
              <Download size={16} />
              <span className="hidden lg:inline">Markdown</span>
            </button>
            <button
              aria-busy={exportingPdf}
              className="btn btn-primary btn-sm"
              disabled={exportingPdf}
              onClick={exportPdf}
              title="Export resume as PDF"
              type="button"
            >
              <Download size={16} />
              <span className="hidden sm:inline">
                {exportingPdf ? "Exporting…" : "Export PDF"}
              </span>
            </button>
            <button
              aria-label={`Use ${appTheme === "business" ? "light" : "business"} theme`}
              className="btn btn-ghost btn-square btn-sm"
              onClick={() => setAppTheme(appTheme === "business" ? "light" : "business")}
              title={`Use ${appTheme === "business" ? "light" : "business"} theme`}
              type="button"
            >
              {appTheme === "business" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main p-3 md:p-4">

        <div className={`workspace workspace-${view}`}>
          <section className={`editor-panel card border border-base-300 bg-base-100 shadow-sm ${view === "preview" ? "screen-hidden" : ""}`}>
            <div className="editor-toolbar flex flex-wrap items-center gap-1 border-b border-base-300 p-2">
              <button
                aria-label="Insert resume title (H1)"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("# Resume title", "Resume title")}
                title="Resume title (H1)"
                type="button"
              >
                <Heading1 size={17} />
              </button>
              <button
                aria-label="Insert section heading (H2)"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("## Section title", "Section title")}
                title="Section heading (H2)"
                type="button"
              >
                <Heading2 size={17} />
              </button>
              <button
                aria-label="Insert entry heading (H3)"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("### Entry title", "Entry title")}
                title="Entry heading (H3)"
                type="button"
              >
                <Heading3 size={17} />
              </button>
              <button
                aria-label="Bold selected text"
                className="btn btn-ghost btn-sm"
                onClick={() => insertText("**", "**", "bold text")}
                title="Bold"
                type="button"
              >
                <Bold size={17} />
              </button>
              <button
                aria-label="Insert bullet"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("- Achievement with measurable impact", "Achievement with measurable impact")}
                title="Bullet"
                type="button"
              >
                <List size={17} />
              </button>
              <button
                aria-label="Insert horizontal rule"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("---")}
                title="Horizontal rule"
                type="button"
              >
                <Minus size={17} />
              </button>
              <div className="mx-1 h-5 w-px bg-base-300" />
              <div
                className="relative"
                ref={iconPickerRef}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIconPickerOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIconPickerOpen(false);
                }}
              >
                <button
                  aria-controls="icon-picker"
                  aria-expanded={iconPickerOpen}
                  aria-haspopup="menu"
                  className="btn btn-ghost btn-sm gap-1.5"
                  onClick={() => setIconPickerOpen((open) => !open)}
                  title="Insert icon"
                  type="button"
                >
                  <Shapes size={16} />
                  <span>Add icon</span>
                </button>
                {iconPickerOpen && (
                  <div
                    aria-label="Insert icon"
                    className="absolute left-0 top-full z-30 mt-1 grid w-64 grid-cols-3 gap-1 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                    id="icon-picker"
                    role="menu"
                  >
                    {ICON_NAMES.map((name) => {
                      const Icon = ICON_COMPONENTS[name];
                      return (
                        <button
                          aria-label={`Insert ${ICON_LABELS[name]} icon`}
                          className="btn btn-ghost h-auto flex-col gap-1 px-3 py-2"
                          key={name}
                          onClick={() => {
                            insertText(`{${name}} `);
                            setIconPickerOpen(false);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <Icon size={18} />
                          <span className="text-xs">{ICON_LABELS[name]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                aria-haspopup="dialog"
                className="btn btn-ghost btn-sm ml-auto gap-1.5"
                onClick={() => docsDialogRef.current?.showModal()}
                type="button"
              >
                <BookOpen size={16} />
                <span>Docs</span>
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <textarea
                aria-activedescendant={
                  iconCompletion
                    ? `icon-suggestion-${matchingIcons[activeIconIndex]}`
                    : undefined
                }
                aria-autocomplete="list"
                aria-controls="icon-suggestions"
                aria-expanded={Boolean(iconCompletion)}
                aria-label="Resume Markdown"
                className="markdown-editor textarea h-full w-full resize-none rounded-none border-0 bg-base-100 font-mono text-[13px] leading-6 outline-none focus:outline-none"
                onBlur={() => setIconCompletion(null)}
                onChange={(event) => {
                  const editor = event.currentTarget;
                  setSaveStatus("Saving…");
                  setSource(editor.value);
                  syncIconCompletion(
                    editor.value,
                    editor.selectionStart,
                    editor,
                  );
                }}
                onKeyDown={handleEditorKeyDown}
                onScroll={(event) => {
                  if (iconCompletion) {
                    positionIconSuggestions(
                      event.currentTarget,
                      matchingIcons.length,
                    );
                  }
                }}
                onSelect={(event) =>
                  syncIconCompletion(
                    event.currentTarget.value,
                    event.currentTarget.selectionStart,
                    event.currentTarget,
                  )
                }
                ref={editorRef}
                role="combobox"
                spellCheck="true"
                value={source}
              />
              {iconCompletion && (
                <ul
                  aria-label="Icon suggestions"
                  className="menu menu-sm absolute z-10 max-h-52 w-52 overflow-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
                  id="icon-suggestions"
                  role="listbox"
                  style={iconMenuPosition}
                >
                  {matchingIcons.map((name, index) => {
                    const Icon = ICON_COMPONENTS[name];
                    return (
                      <li key={name} role="none">
                        <button
                          aria-selected={index === activeIconIndex}
                          className={index === activeIconIndex ? "menu-active" : ""}
                          id={`icon-suggestion-${name}`}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            completeIcon(name);
                          }}
                          role="option"
                          tabIndex="-1"
                          type="button"
                        >
                          <Icon size={16} />
                          <span>{ICON_LABELS[name]}</span>
                          <code className="ml-auto text-xs text-base-content/55">
                            {`{${name}}`}
                          </code>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section
            className={`preview-panel overflow-hidden rounded-2xl border border-base-300 bg-base-300/45 shadow-sm ${view === "write" ? "screen-hidden" : ""}`}
            onKeyDown={handlePreviewKeyDown}
          >
            <div className="preview-chrome flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-4 py-2 text-xs font-medium text-base-content/55">
              <div className="flex items-center gap-2">
                <span>Live preview</span>
                <span className="badge badge-ghost badge-sm">
                  Theme: {selectedResumeTheme.name}
                </span>
                <span className="badge badge-success badge-sm">
                  ATS-friendly
                </span>
                <span className="hidden md:inline">· Letter · single column · selectable text</span>
              </div>
              <div aria-label="Preview zoom controls" className="flex items-center gap-1">
                <button
                  aria-label="Zoom out"
                  className="btn btn-ghost btn-xs btn-square"
                  disabled={previewZoom <= 0.5}
                  onClick={() => adjustPreviewZoom(-0.1)}
                  title="Zoom out (⌘/Ctrl −)"
                  type="button"
                >
                  <ZoomOut size={15} />
                </button>
                <input
                  aria-label="Preview zoom"
                  className="range range-xs hidden w-24 sm:block"
                  max="200"
                  min="50"
                  onChange={(event) => setPreviewZoom(Number(event.target.value) / 100)}
                  step="10"
                  type="range"
                  value={Math.round(previewZoom * 100)}
                />
                <button
                  aria-label={`Reset preview zoom, currently ${Math.round(previewZoom * 100)}%`}
                  className="btn btn-ghost btn-xs w-14 px-1 font-mono tabular-nums"
                  onClick={() => setPreviewZoom(1)}
                  title="Reset zoom to 100% (⌘/Ctrl 0)"
                  type="button"
                >
                  {Math.round(previewZoom * 100)}%
                </button>
                <button
                  aria-label="Zoom in"
                  className="btn btn-ghost btn-xs btn-square"
                  disabled={previewZoom >= 2}
                  onClick={() => adjustPreviewZoom(0.1)}
                  title="Zoom in (⌘/Ctrl +)"
                  type="button"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>
            <div
              aria-label={`Resume preview at ${Math.round(previewZoom * 100)}% zoom`}
              className="preview-stage"
              ref={previewStageRef}
              tabIndex="0"
              title="Use ⌘/Ctrl + scroll to zoom; +, −, or 0 also work"
            >
              <div className="preview-zoom-surface">
                <div className="preview-page-zoom" style={{ zoom: previewZoom }}>
                  <ResumeDocument source={source} theme={resumeTheme} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <dialog className="modal theme-dialog" ref={themeDialogRef}>
        <div className="modal-box max-w-6xl">
          <form className="absolute right-4 top-4" method="dialog">
            <button aria-label="Close theme picker" className="btn btn-ghost btn-sm" type="submit">
              Close
            </button>
          </form>
          <div className="pr-20">
            <h2 className="text-xl font-bold">Choose a theme</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Typography and spacing change; the ATS-safe reading order stays the same.
            </p>
          </div>

          <div aria-label="Resume themes" className="mt-5 grid gap-4 md:grid-cols-3" role="radiogroup">
            {RESUME_THEMES.map(({ id, name, description }) => (
              <label
                className={`theme-card card cursor-pointer overflow-hidden border bg-base-100 transition ${
                  resumeTheme === id
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-base-300 hover:border-primary/55"
                }`}
                key={id}
              >
                <input
                  checked={resumeTheme === id}
                  className="sr-only"
                  name="resume-theme"
                  onChange={() => {
                    setResumeTheme(id);
                    themeDialogRef.current?.close();
                  }}
                  type="radio"
                  value={id}
                />
                <div className="theme-card-preview">
                  <div className="theme-card-document">
                    <ResumeDocument source={source} theme={id} />
                  </div>
                </div>
                <div className="card-body gap-1 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold">{name}</h3>
                    {resumeTheme === id && (
                      <span className="badge badge-primary badge-sm gap-1">
                        <Check size={12} />
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-base-content/60">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <form className="modal-backdrop" method="dialog">
          <button type="submit">Close</button>
        </form>
      </dialog>

      <dialog className="modal docs-dialog" ref={docsDialogRef}>
        <div className="modal-box max-w-lg">
          <form className="absolute right-4 top-4" method="dialog">
            <button aria-label="Close Markdown guide" className="btn btn-ghost btn-sm" type="submit">
              Close
            </button>
          </form>
          <div className="pr-20">
            <h2 className="text-xl font-bold">Markdown guide</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Write plain Markdown; the preview updates as you type.
            </p>
          </div>
          <div className="mt-5 grid gap-2 text-sm">
            {MARKDOWN_GUIDE.map(([syntax, description]) => (
              <div
                className="grid grid-cols-[minmax(8rem,auto)_1fr] items-center gap-4 rounded-box bg-base-200 px-3 py-2"
                key={syntax}
              >
                <code className="font-mono">{syntax}</code>
                <span className="text-base-content/65">{description}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-base-content/55">
            Icons: {ICON_NAMES.join(", ")}.
          </p>
        </div>
        <form className="modal-backdrop" method="dialog">
          <button type="submit">Close</button>
        </form>
      </dialog>
    </div>
  );
}
