#!/usr/bin/env node
"use strict";

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Parses simple "key: value" lines inside a flashcard block, where a value
// may continue onto following lines (e.g. a multi-sentence "back"). A line
// starts a new field only if the text before its first colon is one of the
// known field names; otherwise it's treated as a continuation of the current
// field, so values (and their continuation lines) may safely contain their
// own colons (e.g. "front: What time is 3:00 in 24hr format?" or a
// continuation line like "Note: this is disputed by some historians.").
const KNOWN_FIELDS = new Set(["front", "back", "url"]);

function parseFlashcardBlock(body) {
  const fields = {};
  let currentKey = null;
  body.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    const candidateKey = idx === -1 ? "" : line.slice(0, idx).trim().toLowerCase();
    if (idx !== -1 && KNOWN_FIELDS.has(candidateKey)) {
      fields[candidateKey] = line.slice(idx + 1).trim();
      currentKey = candidateKey;
    } else if (currentKey) {
      const trimmed = line.trim();
      if (trimmed !== "") fields[currentKey] += "\n" + trimmed;
    }
  });
  return fields;
}

function toHtmlLines(escapedStr) {
  return escapedStr.replace(/\n/g, "<br>");
}

function renderFlashcard(fields) {
  const url = fields.url || "";
  const frontEscaped = escapeHtml(fields.front || "");
  const backEscaped = escapeHtml(fields.back || "");
  const front = toHtmlLines(frontEscaped);
  const back = toHtmlLines(backEscaped);
  const imgTag = url
    ? `<img src="${escapeHtml(url)}" alt="${frontEscaped}">`
    : "";

  return `<div class="flashcard">
<div class="flashcard-inner">
<div class="flashcard-front">
${imgTag}
<p class="flashcard-question">${front}</p>
<p class="flashcard-hint">Click to reveal</p>
</div>
<div class="flashcard-back">
<p class="flashcard-answer">${back}</p>
</div>
</div>
</div>`;
}

// Matches ```flashcard ... ``` fenced blocks, non-greedy across lines.
const FLASHCARD_FENCE = /```flashcard\r?\n([\s\S]*?)```/g;

function processContent(content) {
  return content.replace(FLASHCARD_FENCE, (_match, body) => {
    const fields = parseFlashcardBlock(body);
    return renderFlashcard(fields);
  });
}

// book.items is an array of entries, each either {"Chapter": {...}},
// {"PartTitle": "..."}, or {"Separator": null}. Only Chapter entries
// carry renderable content, and each chapter's sub_items form a nested
// tree that must be walked too.
function walkItems(items) {
  for (const item of items) {
    if (item.Chapter) {
      item.Chapter.content = processContent(item.Chapter.content);
      if (item.Chapter.sub_items) {
        walkItems(item.Chapter.sub_items);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  // mdbook first calls `<command> supports <renderer>` to check
  // compatibility; exit 0 means "yes, I support this renderer".
  if (args[0] === "supports") {
    process.exit(0);
  }

  // Actual preprocessing: mdbook sends JSON `[context, book]` on stdin
  // and expects the modified `book` JSON back on stdout.
  const input = await readStdin();
  const [, book] = JSON.parse(input);

  walkItems(book.items);

  process.stdout.write(JSON.stringify(book));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
