View at https://nebupookins.github.io/history/

## Building locally

This book uses [mdbook-mermaid](https://github.com/badboy/mdbook-mermaid) for diagrams. Before running `mdbook build` for the first time (or if the build fails with a missing mermaid file error), install the required JS assets:

```
mdbook-mermaid install .
```

Then build as usual:

```
mdbook build
```
