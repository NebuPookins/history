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

// Parses simple "key: value" lines inside a flashcard block.
// Splitting on the FIRST colon only, so values may safely contain
// their own colons (e.g. "front: What time is 3:00 in 24hr format?").
function parseFlashcardBlock(body) {
  const fields = {};
  body.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) fields[key] = value;
  });
  return fields;
}

function renderFlashcard(fields) {
  const url = fields.url || "";
  const front = escapeHtml(fields.front || "");
  const back = escapeHtml(fields.back || "");
  const imgTag = url
    ? `<img src="${escapeHtml(url)}" alt="${front}">`
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
