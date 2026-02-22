import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';

const CSS_ANIMATIONS = `
  @keyframes codeCardCursorBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes codeCardLineSlideIn {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

let _cssInjected = false;

function ensureCSS() {
  if (_cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CSS_ANIMATIONS;
  document.head.appendChild(el);
  _cssInjected = true;
}

/**
 * CodeCard — Matrix-style floating code display component.
 *
 * Renders code content with a typewriter/terminal animation, blinking cursor,
 * and a frameless holographic appearance. Designed to float in Scene/Panel layouts.
 *
 * @param {string}  code            - Code to display (newlines separate lines)
 * @param {number}  speed           - ms per character (lower = faster)
 * @param {number}  lineDelay       - ms pause after each line completes
 * @param {number}  startDelay      - ms before animation starts
 * @param {boolean} loop            - restart animation after completion
 * @param {string}  color           - text color override (default: theme primary)
 * @param {number}  glowIntensity   - multiplier for text glow (0 = off, 1 = normal)
 * @param {number}  fontSize        - font size in px
 * @param {number}  lineHeight      - line height multiplier
 * @param {number}  maxVisibleLines - max lines shown before older ones fade out
 * @param {number}  width           - container width in px
 * @param {object}  style           - additional inline styles
 * @param {string}  className       - additional CSS class names
 */
export function CodeCard({
  code = '',
  speed = 30,
  lineDelay = 200,
  startDelay = 0,
  loop = false,
  color,
  glowIntensity = 1,
  fontSize = 13,
  lineHeight = 1.7,
  maxVisibleLines = 18,
  width = 380,
  style,
  className = '',
}) {
  const { theme } = useTheme();

  ensureCSS();

  const textColor = color ?? theme.colors.primary;
  const shadowColor = theme.colors.shadow ?? `${textColor}55`;
  const fontFamily =
    theme.typography.fontBody ?? '"JetBrains Mono", "Courier New", monospace';

  const lines = code.split('\n');

  // revealed[i] = number of characters shown on line i
  const [revealed, setRevealed] = useState([]);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'typing' | 'done'
  const timerRef = useRef(null);

  const start = useCallback(() => {
    clearTimeout(timerRef.current);
    setRevealed([]);
    setPhase('typing');
  }, []);

  // Trigger on mount and whenever code or startDelay changes
  useEffect(() => {
    const t = setTimeout(start, Math.max(0, startDelay));
    return () => clearTimeout(t);
  }, [code, startDelay, start]);

  // Drive the typing animation
  useEffect(() => {
    if (phase !== 'typing') return;

    const lineIdx = revealed.length === 0 ? 0 : revealed.length - 1;
    const charIdx = revealed[lineIdx] ?? 0;
    const targetLine = lines[lineIdx] ?? '';

    if (charIdx < targetLine.length) {
      // Reveal next character on the current line
      timerRef.current = setTimeout(() => {
        setRevealed(prev => {
          const next = [...prev];
          next[lineIdx] = charIdx + 1;
          return next;
        });
      }, speed);
    } else {
      // Line complete — advance to the next
      const nextLineIdx = lineIdx + 1;
      if (nextLineIdx >= lines.length) {
        setPhase('done');
        if (loop) {
          timerRef.current = setTimeout(start, 2000);
        }
      } else {
        timerRef.current = setTimeout(() => {
          setRevealed(prev => [...prev, 0]);
        }, lineDelay);
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [phase, revealed, lines, speed, lineDelay, loop, start]);

  // Build the full list of revealed (possibly partial) lines
  const displayLines = lines
    .map((line, i) => (i < revealed.length ? line.slice(0, revealed[i]) : null))
    .filter(l => l !== null);

  // Sliding window — only show the most recent maxVisibleLines
  const visible = displayLines.slice(-maxVisibleLines);
  const offset = Math.max(0, displayLines.length - maxVisibleLines);

  // Index of the actively-typing line within the visible window
  const typingLineGlobal = revealed.length - 1;
  const typingLineVisible = typingLineGlobal - offset;

  const lineHeightPx = fontSize * lineHeight;

  return (
    <div
      className={`code-card${className ? ` ${className}` : ''}`}
      style={{
        width,
        overflow: 'hidden',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        fontFamily,
        fontSize,
        lineHeight,
        color: textColor,
        position: 'relative',
        userSelect: 'none',
        ...style,
      }}
    >
      {visible.map((text, idx) => {
        const isTypingLine = idx === typingLineVisible && phase === 'typing';
        const age = visible.length - 1 - idx; // 0 = newest line
        const opacity = Math.max(0.2, 1 - age * 0.055);
        const glowScale = glowIntensity * Math.max(0.15, 1 - age * 0.09);

        return (
          <div
            key={offset + idx}
            style={{
              whiteSpace: 'pre',
              minHeight: lineHeightPx,
              opacity,
              animation: `codeCardLineSlideIn 0.15s ease-out`,
              textShadow:
                glowIntensity > 0
                  ? `0 0 ${5 * glowScale}px ${shadowColor}, 0 0 ${14 * glowScale}px ${shadowColor}`
                  : 'none',
            }}
          >
            <span>{text}</span>
            {isTypingLine && (
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '0.55em',
                  height: `${fontSize * 0.85}px`,
                  background: textColor,
                  boxShadow: `0 0 6px ${textColor}, 0 0 14px ${shadowColor}`,
                  verticalAlign: 'middle',
                  marginLeft: 1,
                  animation: 'codeCardCursorBlink 0.75s step-end infinite',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Idle blinking cursor after completion */}
      {phase === 'done' && (
        <div style={{ minHeight: lineHeightPx }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.55em',
              height: `${fontSize * 0.85}px`,
              background: textColor,
              boxShadow: `0 0 6px ${textColor}, 0 0 14px ${shadowColor}`,
              verticalAlign: 'middle',
              opacity: 0.75,
              animation: 'codeCardCursorBlink 1.2s step-end infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
