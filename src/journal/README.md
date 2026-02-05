# Journal Integration

Connect comic-engine with your Obsidian journal to visualize journal entries as comic panels and explore themes across time.

## Overview

This integration allows you to:
1. Mark journal entries in Obsidian for comic-ification
2. Answer story prompts to flesh out the visual narrative
3. Export entries as JSON
4. Import into comic-engine to generate 3D parallax comic scenes
5. Explore themes across multiple journal entries

## Quick Start

### 1. Set Up Obsidian Template

Copy the template from `templates/obsidian-comic-template.md` to your Obsidian templates folder.

When creating a new journal entry, use this template to get the proper frontmatter structure.

### 2. Mark Passages for Comics

In your journal entry, mark the passage you want to turn into a comic using one of these methods:

**Method A: Explicit markers**
```markdown
[Marked passage begins]
Your meaningful journal passage here...
[Marked passage ends]
```

**Method B: Highlight syntax**
```markdown
==Your highlighted passage here==
```

**Method C: Code block**
````markdown
```comic
Your passage in a code block
```
````

### 3. Fill in Story Prompts

Update the frontmatter with answers to the story prompts:

```yaml
---
comic_candidate: true
date: 2025-01-15
themes:
  - healing
  - growth
tags:
  - journal
  - to-comic
visual_style: torn
emotional_intensity: 7

characters:
  - myself
  - my younger self
dominant_emotion: bittersweet relief
visual_metaphor: a door opening to light, but with shadows behind
before_context: Years of carrying this weight alone
after_context: First steps toward letting it go
---
```

### 4. Export to JSON

Export your marked entries to JSON format. See `templates/example-export.json` for the expected structure.

You can do this manually or use an Obsidian plugin (like Dataview or Templater) to automate the export.

### 5. Import into Comic-Engine

```jsx
import { useJournalEntries, generateThemeSequenceScene } from './journal';

function MyJournalScene() {
  const { sequences, loadFromSource } = useJournalEntries();

  useEffect(() => {
    loadFromSource('/path/to/your/exported-journal.json');
  }, []);

  // Generate scenes from your entries
  // See JournalExample.jsx for full example
}
```

## API Reference

### Schema

#### JournalEntry
```javascript
{
  metadata: {
    id: string,               // Unique identifier
    date: string,             // ISO date string
    themes: string[],         // Array of themes
    comicCandidate: boolean,  // Whether marked for comic
    tags: string[],           // Obsidian tags
    storyPrompts: {
      characters: string[],        // Who's in the scene
      dominantEmotion: string,     // Dominant emotion
      visualMetaphor: string,      // Visual metaphor
      beforeContext: string,       // What happened before
      afterContext: string,        // What happens after
    },
    visualStyle?: string,     // 'default' | 'polaroid' | 'torn' | 'monitor'
    emotionalIntensity?: number, // 1-10 scale
  },
  content: string,  // Full markdown content
  excerpt: string,  // Marked passage for comic
}
```

#### ThemeSequence
```javascript
{
  theme: string,           // Theme name
  entryIds: string[],      // Array of entry IDs (chronological)
  entries: JournalEntry[], // Full entry objects
  narrativeArc: string,    // Description of theme evolution
}
```

### Parser Functions

#### `parseObsidianMarkdown(markdown, filename?)`
Parses Obsidian markdown with frontmatter into a JournalEntry.

```javascript
import { parseObsidianMarkdown } from './journal';

const markdown = `---
comic_candidate: true
date: 2025-01-15
themes:
  - healing
---

# My Entry

==This is the marked passage==
`;

const entry = parseObsidianMarkdown(markdown, '2025-01-15.md');
```

#### `parseBatch(files)`
Parses multiple markdown files at once.

```javascript
const files = [
  { filename: 'entry1.md', content: '...' },
  { filename: 'entry2.md', content: '...' },
];

const entries = parseBatch(files);
```

#### `groupByTheme(entries)`
Groups entries by theme.

```javascript
const themeMap = groupByTheme(entries);
// { healing: [...], growth: [...], ... }
```

#### `createThemeSequences(themeMap)`
Creates theme sequences from grouped entries.

```javascript
const sequences = createThemeSequences(themeMap);
// [{ theme: 'healing', entries: [...], ... }, ...]
```

### Scene Generator Functions

#### `generateSceneFromEntry(entry, options?)`
Generates a scene configuration from a single journal entry.

```javascript
import { generateSceneFromEntry } from './journal';

const sceneConfig = generateSceneFromEntry(entry, {
  centerPosition: [0, 0, 0],
  includeBackground: true,
});
```

#### `generateThemeSequenceScene(themeSequence, options?)`
Generates a scene with multiple panels exploring a theme.

```javascript
const sceneConfig = generateThemeSequenceScene(sequence, {
  layout: 'timeline', // 'timeline' | 'spiral' | 'stack'
});
```

Layouts:
- **timeline**: Linear horizontal spread with depth
- **spiral**: Entries spiral inward/outward
- **stack**: Stacked in Z-depth

#### `exportAsComponent(sceneConfig)`
Exports a scene configuration as React component code.

```javascript
const componentCode = exportAsComponent(sceneConfig);
// Returns JSX string that can be saved as a .jsx file
```

### React Hook

#### `useJournalEntries(options?)`
React hook for managing journal entries.

```javascript
const {
  entries,           // All loaded entries
  themes,            // Grouped by theme
  sequences,         // Theme sequences
  loading,           // Loading state
  error,             // Error state

  // Methods
  loadFromSource,    // Load from JSON URL
  parseMarkdownFiles, // Parse markdown files
  addEntry,          // Add single entry
  removeEntry,       // Remove by ID
  updateEntry,       // Update entry
  getByTheme,        // Get entries for theme
  getComicCandidates, // Get comic-marked entries
  getByDateRange,    // Filter by date range
  clear,             // Clear all entries
} = useJournalEntries({
  autoLoad: false,
  initialEntries: [],
});
```

## Visual Styles

The generator maps emotions and visual styles to panel variants:

| Visual Style | Panel Variant | Best For |
|--------------|---------------|----------|
| `default` | Standard comic panel | General entries |
| `polaroid` | Photo-style frame | Nostalgic/memory entries |
| `torn` | Torn paper effect | Raw/intense emotions |
| `monitor` | CRT monitor style | Disconnection/digital themes |
| `borderless` | No border | Clear/present moments |

## Emotional Intensity

The `emotionalIntensity` (1-10) affects visual positioning:

- **1-3**: Far background (z=-200), calm, distant
- **4-6**: Midground (z=0), present, engaged
- **7-10**: Foreground (z=150), immediate, intense

## Theme Exploration

The system automatically tracks themes across entries:

1. Tag entries with themes in frontmatter
2. Multiple entries can share themes
3. Use `generateThemeSequenceScene()` to create narrative arcs
4. Explore how themes evolve over time visually

## Example Workflow

1. **Journal in Obsidian** using the template
2. **Mark meaningful passages** with highlight or markers
3. **Fill in story prompts** in frontmatter
4. **Tag with themes** to connect entries
5. **Export to JSON** when ready
6. **Import in comic-engine** with `loadFromSource()`
7. **Generate scenes** from theme sequences
8. **Navigate visually** through your healing journey

## Integration with Art Therapy Framework

This journal integration is designed to work with art therapy principles:

- **Externalization**: Transform internal experiences into visual form
- **Narrative**: Build coherent stories from fragmented experiences
- **Metaphor**: Use visual metaphors to represent complex emotions
- **Theme Tracking**: See patterns and progress over time
- **Safety**: Choose what to share and how to represent it

## Advanced Usage

### Custom Visual Mappings

You can customize how emotions map to visuals by modifying `sceneGenerator.js`:

```javascript
// Add custom emotion -> visual mappings
function getEmotionalPanelStyle(emotion) {
  if (emotion.includes('your-custom-emotion')) {
    return {
      variant: 'custom-variant',
      filter: 'your-filter',
    };
  }
  // ...
}
```

### Automated Export from Obsidian

Use Dataview or Templater to create automated exports:

```javascript
// Dataview query example
TABLE
  file.name as id,
  date,
  themes,
  comic_candidate,
  tags
FROM #to-comic
WHERE comic_candidate = true
```

### Dynamic Scene Generation

Generate scenes dynamically based on user interaction:

```javascript
const [currentTheme, setCurrentTheme] = useState('healing');
const sequence = sequences.find(s => s.theme === currentTheme);
const scene = generateThemeSequenceScene(sequence, { layout: 'spiral' });
```

## Troubleshooting

**Q: My entries aren't being parsed correctly**
- Check that frontmatter is valid YAML between `---` markers
- Ensure arrays use the `- item` format
- Verify boolean values are lowercase `true`/`false`

**Q: Marked passages aren't being extracted**
- Use one of the three supported marker formats
- Check for typos in markers (case-insensitive)
- Ensure markers are on their own lines

**Q: Themes aren't grouping correctly**
- Themes must be in an array in frontmatter
- Use consistent theme names across entries
- Check for typos in theme names

## Files

```
src/journal/
├── README.md                 # This file
├── schema.js                 # Data format definitions
├── parser.js                 # Obsidian markdown parser
├── sceneGenerator.js         # Scene generation logic
├── useJournalEntries.js      # React hook
├── index.js                  # Main exports
└── templates/
    ├── obsidian-comic-template.md   # Obsidian template
    └── example-export.json          # Example data
```

## Next Steps

- See `src/pages/JournalExample.jsx` for a complete implementation
- Customize visual mappings for your needs
- Create your own layout algorithms
- Integrate with your existing Obsidian workflow
- Build narrative sequences across multiple themes

---

**Related**: [Notion Ticket](https://www.notion.so/2fd4d0c655b8816eb5f9f83cc0911430) | [Issue #1](https://github.com/Luan-vP/comic-engine/issues/1)
