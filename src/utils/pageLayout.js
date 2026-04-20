/**
 * Shared page layout styles.
 */

/**
 * Full-viewport flex container, vertically stacked and centered.
 * Used for loading/error/empty states on scene pages.
 *
 * @param {object} theme  from useTheme()
 * @returns {object}      React inline style object
 */
export function centeredBox(theme) {
  return {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.backgroundGradient,
    fontFamily: theme.typography.fontBody,
  };
}
