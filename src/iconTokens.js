export const ICON_NAMES = [
  "email",
  "phone",
  "location",
  "github",
  "linkedin",
  "star",
];

const TOKEN_NAMES = [...ICON_NAMES, "mail"].join("|");
const TOKEN_PATTERN = new RegExp(`(\\{(?:${TOKEN_NAMES})\\})`, "gi");
const EXACT_TOKEN_PATTERN = new RegExp(`^\\{(${TOKEN_NAMES})\\}$`, "i");

export function iconCompletionAt(text, cursor) {
  const match = text.slice(0, cursor).match(/\{([a-z]*)$/i);
  if (!match) return null;

  const query = match[1].toLowerCase();
  const names = ICON_NAMES.filter((name) => name.startsWith(query));
  return names.length
    ? { start: cursor - match[0].length, names }
    : null;
}

export function splitIconTokens(text) {
  return text.split(TOKEN_PATTERN).filter(Boolean).map((value) => {
    const match = value.match(EXACT_TOKEN_PATTERN);

    if (!match) return { type: "text", value };

    const name = match[1].toLowerCase();
    return { type: "icon", name: name === "mail" ? "email" : name };
  });
}
