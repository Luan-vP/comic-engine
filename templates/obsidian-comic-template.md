---
title: "Entry title here"
date: 2026-01-01
comic-candidate: true
themes:
  - healing
  - identity
characters:
  - Me
emotion: "nostalgic"
emotional_intensity: 6
visual_metaphor: "standing at the edge of a frozen lake"
before_context: "What was happening just before this moment?"
after_context: "What changed or remained after?"
---

# Entry title here

Write your journal entry freely here. Mark the specific passage you want to turn into a comic panel using one of the methods below.

---

## Method 1 — Explicit markers (recommended)

[Marked passage begins]
Write the specific memory or moment you want to visualize here.
It can span multiple lines. This will become the main text in the comic panel.
[Marked passage ends]

---

## Method 2 — Comic code block

```comic
Alternative: paste your passage inside this code block.
Only this text will be used if no explicit markers are found.
```

---

## Method 3 — Highlights

Use ==highlighted text== to mark passages if you prefer
Obsidian's native highlight syntax. Any ==highlighted section== will be extracted.

---

## Story prompts (for reference)

Answer these in the frontmatter above — they shape how the panel is styled:

- **Who's in this scene?** → `characters`
- **What's the dominant emotion?** → `emotion`
  - Nostalgic/memory → polaroid frame
  - Raw/grief/anger → torn paper
  - Disconnected/numb → monitor/CRT
  - Calm/joy/clarity → borderless
  - Other → standard comic panel
- **How intense is this feeling?** → `emotional_intensity` (1–10)
  - 1–3: Far background, subtle movement
  - 4–6: Midground, moderate parallax
  - 7–10: Foreground, dramatic presence
- **What visual metaphor captures this?** → `visual_metaphor`
- **What happened just before?** → `before_context`
- **What changed after?** → `after_context`
- **What themes does this connect to?** → `themes` (used for grouping entries)

---

## Exporting

To load in comic-engine:
1. **Single entry**: Export this note as a `.md` file and open it in the Journal page.
2. **Batch export**: Collect multiple entries into a `.json` file following the format in `templates/example-export.json`.
