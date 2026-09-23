"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  escapeHtml,
  parseFlashcardBlock,
  toHtmlLines,
  renderFlashcard,
  processContent,
  walkItems,
} = require("./mdbook-flashcard.js");

test("escapeHtml escapes the five reserved HTML characters", () => {
  assert.equal(escapeHtml(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;'&lt;/a&gt;");
});

test("parseFlashcardBlock reads front/back/url fields", () => {
  const fields = parseFlashcardBlock("front: Q?\nback: A.\nurl: http://example.com/x.png");
  assert.deepEqual(fields, {
    front: "Q?",
    back: "A.",
    url: "http://example.com/x.png",
  });
});

test("parseFlashcardBlock keeps a colon inside a field's first line", () => {
  const fields = parseFlashcardBlock("front: What time is 3:00 in 24hr format?\nback: 03:00");
  assert.equal(fields.front, "What time is 3:00 in 24hr format?");
  assert.equal(fields.back, "03:00");
});

test("parseFlashcardBlock joins continuation lines onto the current field", () => {
  const fields = parseFlashcardBlock(
    "front: Q?\nback: Line one.\nNote: this is disputed by some historians.\nLine three."
  );
  assert.equal(fields.back, "Line one.\nNote: this is disputed by some historians.\nLine three.");
});

test("parseFlashcardBlock drops blank continuation lines without breaking the field", () => {
  const fields = parseFlashcardBlock("front: Q?\nback: Line one.\n\nLine two.");
  assert.equal(fields.back, "Line one.\nLine two.");
});

test("parseFlashcardBlock ignores lines before any known field starts", () => {
  const fields = parseFlashcardBlock("not a field: value\nfront: Q?");
  assert.deepEqual(fields, { front: "Q?" });
});

test("toHtmlLines converts newlines to <br>", () => {
  assert.equal(toHtmlLines("a\nb\nc"), "a<br>b<br>c");
});

test("renderFlashcard escapes front/back text and omits the image when url is absent", () => {
  const html = renderFlashcard({ front: "<b>Q</b>", back: "A & B" });
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;b&gt;Q&lt;/b&gt;"));
  assert.ok(html.includes("A &amp; B"));
});

test("renderFlashcard includes an escaped image tag when url is present", () => {
  const html = renderFlashcard({ front: "Q", back: "A", url: 'x.png"><script>' });
  assert.ok(html.includes('<img src="x.png&quot;&gt;&lt;script&gt;" alt="Q">'));
});

test("processContent replaces a flashcard fence with rendered HTML", () => {
  const md = "before\n\n```flashcard\nfront: Q?\nback: A.\n```\n\nafter";
  const out = processContent(md);
  assert.ok(out.includes("before"));
  assert.ok(out.includes("after"));
  assert.ok(out.includes('class="flashcard"'));
  assert.ok(!out.includes("```flashcard"));
});

test("processContent leaves content without flashcard fences untouched", () => {
  const md = "# Title\n\nsome text";
  assert.equal(processContent(md), md);
});

test("walkItems rewrites Chapter content in place, including nested sub_items", () => {
  const book = {
    items: [
      { PartTitle: "Part One" },
      { Separator: null },
      {
        Chapter: {
          name: "Ch1",
          content: "```flashcard\nfront: Q?\nback: A.\n```",
          sub_items: [
            {
              Chapter: {
                name: "Ch1.1",
                content: "```flashcard\nfront: Q2?\nback: A2.\n```",
                sub_items: [],
              },
            },
          ],
        },
      },
    ],
  };

  walkItems(book.items);

  assert.ok(book.items[2].Chapter.content.includes('class="flashcard"'));
  assert.ok(book.items[2].Chapter.sub_items[0].Chapter.content.includes('class="flashcard"'));
});
