# Teaching notes

- **One question per turn.** Several questions at once overwhelm; the user answers only the first.
- **State reference facts directly** (property names, option lists, which actions a policy covers). Keep questions for reasoning and design choices, not "go look it up".
- **No solution code** (see `.claude/CLAUDE.md`). The user writes the YAML and JS.
- Known stumbling points: YAML indentation; file name vs function name in `Handler`; unsaved edits (always check the file on disk); function vs parameter vs string literal in `console.log`.
- The sandbox (`hello-lambda/`) used REST API (`Type: Api`); the project uses HTTP API (payload format 2.0). Watch for event-shape mix-ups.
