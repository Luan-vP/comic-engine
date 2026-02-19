---
title: My Memory
date: 2024-01-15
comic-candidate: true
tags:
  - to-comic
themes:
  - healing
emotion: nostalgic
emotional-intensity: 6
characters:
  - Me
  - My sister
visual-metaphor: an open window in winter
context-before: We had been estranged for years
context-after: We hugged for the first time in a decade
---

# My Memory

Your journal entry goes here. Write freely about the experience, moment, or memory you want to visualise.

---

## Marking Passages for Comic

Use **one** of the three methods below to mark the specific passages you want turned into comic panels. The comic engine will pick up whichever method you use — no need to use all three.

### Method 1: Explicit markers (recommended)

[Marked passage begins]
The moment I saw her face at the door, time collapsed. All those years folded into this single breath.
[Marked passage ends]

### Method 2: Obsidian highlights

Remember to ==highlight the exact words you want to comic-ify== directly in your prose.

### Method 3: Comic code block

```comic
This passage will be turned into a comic panel.
Write the scene here as you want it captured.
```

---

## Story Prompt Reference

Fill in the frontmatter fields above to give the comic engine visual context:

| Field | Description | Example |
|---|---|---|
| `emotion` | Dominant emotion in the scene | `nostalgic`, `raw`, `joyful` |
| `emotional-intensity` | 1 (calm) → 10 (overwhelming) | `6` |
| `characters` | Who appears in this scene | `Me`, `My sister` |
| `visual-metaphor` | A visual metaphor for the moment | `an open window in winter` |
| `context-before` | What happened just before | `We had been estranged for years` |
| `context-after` | What happened just after | `We hugged for the first time` |
| `themes` | Thematic tags for grouping entries | `healing`, `family` |

## Emotion → Panel Style Mapping

The `emotion` field automatically selects a panel visual style:

- **Nostalgic / memory / wistful** → Polaroid frame
- **Raw / intense / grief / pain** → Torn paper edge
- **Disconnected / numb / dissociated** → Monitor / CRT screen
- **Clear / calm / present / joy** → Borderless (clean)
- *(anything else)* → Default comic panel

## Exporting to JSON

Once you have several entries marked up, export them as a JSON array using the format in `templates/example-export.json`. Then load the `.json` file directly in the Journal page.
