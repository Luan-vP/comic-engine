/**
 * Slug helpers shared across the app.
 *
 * A "slug" is the URL-safe form: lowercase, hyphen-separated, alphanumeric.
 * A "title" is the human-readable form derived from a slug.
 */

/**
 * Convert a human-readable name to a URL-safe slug.
 *
 * @param {string} name
 * @returns {string}
 */
export function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a slug back to a Title Case string.
 *
 * @param {string} slug
 * @returns {string}
 */
export function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
