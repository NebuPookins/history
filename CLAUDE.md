# CLAUDE.md

## mdbook preprocessor: book.items, not book.sections

`preprocessors/mdbook-flashcard.js` reads the chapter list from the JSON
mdbook sends on stdin. **The correct key is `book.items`, not
`book.sections`**, despite `sections` being the field name in mdbook's Rust
`Book` struct — mdbook's `#[serde(rename)]` (or equivalent) serializes it to
JSON as `items`.

A prior commit "fixed" a `TypeError: items is not iterable` by switching
`book.items` to `book.sections`, reasoning from the Rust struct definition
instead of the actual wire format. That inverted a working preprocessor into
a broken one — `book.sections` is `undefined` in the real payload, so the
error just changed from "not iterable" (visible) to a different failure.

Before touching this file again:
1. Run `mdbook build` yourself and confirm success/failure — don't infer the
   correct field name from documentation or the Rust source.
2. If you need to inspect the actual payload, temporarily add
   `require("fs").writeFileSync("/tmp/mdbook-input.json", input)` right
   after `readStdin()`, run `mdbook build`, and inspect the dumped JSON's
   top-level keys before changing any field name. Remove the debug line
   before committing.
