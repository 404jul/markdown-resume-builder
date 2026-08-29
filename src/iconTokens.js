const TOKEN_PATTERN = /(\{(?:github|linkedin|email|mail|phone|location|star)\})/gi;
const EXACT_TOKEN_PATTERN = /^\{(github|linkedin|email|mail|phone|location|star)\}$/i;

export function splitIconTokens(text) {
  return text.split(TOKEN_PATTERN).filter(Boolean).map((value) => {
    const match = value.match(EXACT_TOKEN_PATTERN);

    if (!match) return { type: "text", value };

    const name = match[1].toLowerCase();
    return { type: "icon", name: name === "mail" ? "email" : name };
  });
}
