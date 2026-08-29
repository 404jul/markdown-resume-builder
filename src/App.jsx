import { useEffect, useRef, useState } from "react";
import {
  Check,
  Bold,
  Columns2,
  Download,
  Eye,
  Heading2,
  List,
  Minus,
  Moon,
  Palette,
  PenLine,
  Printer,
  Sun,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ResumeDocument from "./ResumeDocument.jsx";

const DOCUMENT_KEY = "resume-md:document";
const RESUME_THEME_KEY = "resume-md:resume-theme";
const APP_THEME_KEY = "resume-md:app-theme";

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

export default function App() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const themeDialogRef = useRef(null);
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
  const [previewZoom, setPreviewZoom] = useState(1);
  const selectedResumeTheme =
    RESUME_THEMES.find(({ id }) => id === resumeTheme) ?? RESUME_THEMES[0];

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

  function printResume() {
    const previousTitle = document.title;
    document.title = resumeFileName(source);
    window.print();
    document.title = previousTitle;
  }

  function adjustPreviewZoom(change) {
    setPreviewZoom((current) =>
      Math.min(2, Math.max(0.5, Number((current + change).toFixed(1)))),
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
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary font-mono text-sm font-black text-primary-content shadow-sm">
              R.
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-bold tracking-tight">Resume.md</h1>
                <span className="badge badge-ghost badge-sm hidden sm:inline-flex">local-first</span>
              </div>
              <p className="truncate text-xs text-base-content/55">ATS-friendly Markdown to PDF</p>
            </div>
          </div>

          <button
            aria-label={`Use ${appTheme === "business" ? "light" : "business"} theme`}
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setAppTheme(appTheme === "business" ? "light" : "business")}
            title={`Use ${appTheme === "business" ? "light" : "business"} theme`}
            type="button"
          >
            {appTheme === "business" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="app-main p-3 md:p-5">
        <section className="control-bar mb-4 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div aria-label="Editor view" className="tabs tabs-box" role="tablist">
              {VIEWS.map(({ id, name, icon: Icon }) => (
                <button
                  aria-selected={view === id}
                  className={`tab gap-1.5 ${view === id ? "tab-active" : ""}`}
                  key={id}
                  onClick={() => setView(id)}
                  role="tab"
                  type="button"
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{name}</span>
                </button>
              ))}
            </div>

            <button
              aria-haspopup="dialog"
              className="btn btn-outline btn-sm gap-2"
              onClick={() => themeDialogRef.current?.showModal()}
              type="button"
            >
              <Palette size={16} />
              <span className="hidden text-xs uppercase tracking-wider opacity-55 md:inline">Theme</span>
              <span>{selectedResumeTheme.name}</span>
            </button>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span className="hidden items-center gap-1.5 text-xs text-base-content/50 lg:flex">
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
                <span className="hidden sm:inline">Open</span>
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={downloadMarkdown}
                title="Download Markdown"
                type="button"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Markdown</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={printResume}
                title="Open the browser print dialog and choose Save as PDF"
                type="button"
              >
                <Printer size={16} />
                Print / PDF
              </button>
            </div>
          </div>
        </section>

        <div className={`workspace workspace-${view}`}>
          <section className={`editor-panel card border border-base-300 bg-base-100 shadow-sm ${view === "preview" ? "screen-hidden" : ""}`}>
            <div className="editor-toolbar flex flex-wrap items-center gap-1 border-b border-base-300 p-2">
              <button
                aria-label="Insert section heading"
                className="btn btn-ghost btn-sm"
                onClick={() => insertBlock("## Section title", "Section title")}
                title="Section heading"
                type="button"
              >
                <Heading2 size={17} />
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
              <select
                aria-label="Insert icon token"
                className="select select-ghost select-sm w-32"
                defaultValue=""
                onChange={(event) => {
                  insertText(`${event.target.value} `);
                  event.target.value = "";
                }}
                title="Insert icon token"
              >
                <option disabled value="">Add icon</option>
                <option value="{email}">Email</option>
                <option value="{phone}">Phone</option>
                <option value="{location}">Location</option>
                <option value="{github}">GitHub</option>
                <option value="{linkedin}">LinkedIn</option>
                <option value="{star}">Star</option>
              </select>
              <span className="ml-auto hidden font-mono text-[11px] text-base-content/45 xl:inline"># headings · **bold** · - bullets · --- rule · {"{github}"} icons</span>
            </div>

            <textarea
              aria-label="Resume Markdown"
              className="markdown-editor textarea w-full resize-none rounded-none border-0 bg-base-100 font-mono text-[13px] leading-6 outline-none focus:outline-none"
              onChange={(event) => {
                setSaveStatus("Saving…");
                setSource(event.target.value);
              }}
              ref={editorRef}
              spellCheck="true"
              value={source}
            />
          </section>

          <section
            className={`preview-panel overflow-hidden rounded-2xl border border-base-300 bg-base-300/45 shadow-sm ${view === "write" ? "screen-hidden" : ""}`}
            onKeyDown={handlePreviewKeyDown}
          >
            <div className="preview-chrome flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-4 py-2 text-xs font-medium text-base-content/55">
              <div className="flex items-center gap-2">
                <span>Live preview</span>
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
              tabIndex="0"
              title="Focus here to use ⌘/Ctrl +, −, or 0"
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
                    <div className="resume-page" data-resume-theme={id}>
                      <h1>John Doe</h1>
                      <p>john.doe@example.com · City, ST</p>
                      <hr />
                      <h2>Experience</h2>
                      <h3>Product Engineer — Example Co.</h3>
                      <p><em>2022–Present</em></p>
                      <ul>
                        <li>Improved a core workflow by <strong>38%</strong>.</li>
                        <li>Built reliable tools for customer teams.</li>
                      </ul>
                      <h2>Skills</h2>
                      <p>React, TypeScript, PostgreSQL</p>
                    </div>
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
    </div>
  );
}
