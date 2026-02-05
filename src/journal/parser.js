/**
 * Obsidian Markdown Parser for Journal Integration
 *
 * Parses Obsidian markdown files with frontmatter into JournalEntry objects
 */

/**
 * Parses YAML frontmatter from markdown
 * @param {string} markdown - The markdown content
 * @returns {{ frontmatter: Object, content: string }}
 */
function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const [, frontmatterText, content] = match;
  const frontmatter = {};

  // Simple YAML parser (for basic key-value pairs and arrays)
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith('- ')) {
      if (currentArray) {
        currentArray.push(trimmed.slice(2).trim());
      }
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (value === '') {
        // Start of array
        currentKey = key;
        currentArray = [];
        frontmatter[key] = currentArray;
      } else if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
        currentArray = null;
      } else if (!isNaN(value) && value !== '') {
        frontmatter[key] = Number(value);
        currentArray = null;
      } else {
        frontmatter[key] = value;
        currentArray = null;
      }
    }
  }

  return { frontmatter, content: content.trim() };
}

/**
 * Extracts marked passage from content
 * Looks for patterns like [Marked passage begins]...[Marked passage ends]
 * or highlighted text markers
 * @param {string} content - The markdown content
 * @returns {string|null} - The extracted passage or null
 */
function extractMarkedPassage(content) {
  // Try explicit markers
  const markerRegex = /\[Marked passage begins?\]([\s\S]*?)\[Marked passage ends?\]/i;
  const markerMatch = content.match(markerRegex);
  if (markerMatch) {
    return markerMatch[1].trim();
  }

  // Try highlight markers ==text==
  const highlightRegex = /==([\s\S]+?)==/;
  const highlightMatch = content.match(highlightRegex);
  if (highlightMatch) {
    return highlightMatch[1].trim();
  }

  // Try comic-marked blocks
  const comicBlockRegex = /```comic\n([\s\S]*?)\n```/;
  const comicMatch = content.match(comicBlockRegex);
  if (comicMatch) {
    return comicMatch[1].trim();
  }

  return null;
}

/**
 * Parses Obsidian tags from content (e.g., #tag)
 * @param {string} content - The markdown content
 * @returns {string[]} - Array of tags
 */
function extractTags(content) {
  const tagRegex = /#[\w-]+/g;
  const matches = content.match(tagRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Parses story prompts from frontmatter
 * @param {Object} frontmatter - The frontmatter object
 * @returns {Object|null} - Parsed story prompts or null
 */
function parseStoryPrompts(frontmatter) {
  // Try structured story_prompts field
  if (frontmatter.story_prompts || frontmatter.storyPrompts) {
    const prompts = frontmatter.story_prompts || frontmatter.storyPrompts;
    return {
      characters: prompts.characters || [],
      dominantEmotion: prompts.dominant_emotion || prompts.dominantEmotion || '',
      visualMetaphor: prompts.visual_metaphor || prompts.visualMetaphor || '',
      beforeContext: prompts.before_context || prompts.beforeContext || '',
      afterContext: prompts.after_context || prompts.afterContext || '',
    };
  }

  // Try individual fields
  if (frontmatter.characters || frontmatter.emotion || frontmatter.metaphor) {
    return {
      characters: frontmatter.characters || [],
      dominantEmotion: frontmatter.emotion || frontmatter.dominant_emotion || '',
      visualMetaphor: frontmatter.metaphor || frontmatter.visual_metaphor || '',
      beforeContext: frontmatter.before_context || frontmatter.context_before || '',
      afterContext: frontmatter.after_context || frontmatter.context_after || '',
    };
  }

  return null;
}

/**
 * Parses an Obsidian markdown file into a JournalEntry
 * @param {string} markdown - The markdown content
 * @param {string} [filename] - Optional filename for generating ID
 * @returns {Object} - JournalEntry object
 */
export function parseObsidianMarkdown(markdown, filename = null) {
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Extract ID from filename or frontmatter
  const id = frontmatter.id ||
             filename?.replace(/\.md$/, '') ||
             `entry-${Date.now()}`;

  // Extract date
  const date = frontmatter.date ||
               frontmatter.created ||
               new Date().toISOString();

  // Extract themes
  const themes = frontmatter.themes ||
                 frontmatter.theme ? [frontmatter.theme] :
                 [];

  // Check if comic candidate
  const comicCandidate = frontmatter.comic_candidate === true ||
                         frontmatter.comicCandidate === true ||
                         extractTags(content).includes('#to-comic');

  // Extract tags
  const tags = [
    ...(frontmatter.tags || []),
    ...extractTags(content),
  ];

  // Parse story prompts
  const storyPrompts = parseStoryPrompts(frontmatter) || {
    characters: [],
    dominantEmotion: '',
    visualMetaphor: '',
    beforeContext: '',
    afterContext: '',
  };

  // Extract marked passage
  const excerpt = extractMarkedPassage(content) || '';

  // Visual style
  const visualStyle = frontmatter.visual_style ||
                      frontmatter.visualStyle ||
                      frontmatter.panel_style;

  // Emotional intensity
  const emotionalIntensity = frontmatter.emotional_intensity ||
                             frontmatter.emotionalIntensity ||
                             frontmatter.intensity;

  return {
    metadata: {
      id,
      date,
      themes,
      comicCandidate,
      tags: [...new Set(tags)],
      storyPrompts,
      visualStyle,
      emotionalIntensity,
    },
    content,
    excerpt,
  };
}

/**
 * Parses a batch of Obsidian markdown files
 * @param {Array<{filename: string, content: string}>} files - Array of files
 * @returns {Object[]} - Array of JournalEntry objects
 */
export function parseBatch(files) {
  return files.map(({ filename, content }) =>
    parseObsidianMarkdown(content, filename)
  );
}

/**
 * Groups entries by theme
 * @param {Object[]} entries - Array of JournalEntry objects
 * @returns {Object} - Map of theme -> entries
 */
export function groupByTheme(entries) {
  const themeMap = {};

  for (const entry of entries) {
    for (const theme of entry.metadata.themes) {
      if (!themeMap[theme]) {
        themeMap[theme] = [];
      }
      themeMap[theme].push(entry);
    }
  }

  // Sort each theme's entries by date
  for (const theme in themeMap) {
    themeMap[theme].sort((a, b) =>
      new Date(a.metadata.date) - new Date(b.metadata.date)
    );
  }

  return themeMap;
}

/**
 * Creates theme sequences from grouped entries
 * @param {Object} themeMap - Map of theme -> entries
 * @returns {Object[]} - Array of ThemeSequence objects
 */
export function createThemeSequences(themeMap) {
  return Object.entries(themeMap).map(([theme, entries]) => ({
    theme,
    entryIds: entries.map(e => e.metadata.id),
    entries: entries,
    narrativeArc: `Evolution of ${theme} through ${entries.length} entries`,
  }));
}
