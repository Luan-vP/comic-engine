import React from 'react';
import { SceneObject } from './SceneObject';
import { CARD_TYPE_REGISTRY } from './cardTypes';

/**
 * SavedObjectRenderer - renders a persisted scene object from scene.json's objects array.
 *
 * Looks up the card type in CARD_TYPE_REGISTRY, renders its content, and wraps it
 * in a <SceneObject>. Shared between DynamicScenePage (editor) and ComicBookReader (read-only).
 *
 * Props:
 *   object            — the scene object (required). Expects `type`, optional `position`, `parallaxFactor`, `id`.
 *   onObjectClick     — read-only click handler: `(objectId) => void`. Used by the reader for theme triggers, etc.
 *                       Mutually exclusive with `onSelect`; if both are passed, `onSelect` wins (editor mode).
 *
 *   Editor-only (all optional — omit for read-only behavior):
 *   selected          — when true, renders a selection outline and "grab" cursor.
 *   overridePosition  — overrides `object.position` during drag (editor live-drag feedback).
 *   onSelect          — click handler: `(objectId) => void`. When passed, the component is in editor mode
 *                       and adds a transparent overlay div for reliable click capture.
 *   onDragStart       — drag handler passed through to SceneObject.
 */
export function SavedObjectRenderer({
  object,
  selected = false,
  overridePosition,
  onSelect,
  onDragStart,
  onObjectClick,
}) {
  const position = overridePosition || object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.6;

  const cardType = CARD_TYPE_REGISTRY.find((ct) => ct.id === object.type);
  const content = cardType ? cardType.renderContent(object) : null;

  if (!content) return null;

  // Editor mode is active when `onSelect` is provided. In editor mode we:
  //   - forward drag handlers
  //   - render a selection outline when `selected`
  //   - add a transparent overlay <div> inside the SceneObject to make the
  //     entire card clickable (avoids card children swallowing clicks).
  const editorMode = Boolean(onSelect);

  const clickHandler = editorMode
    ? () => onSelect(object.id)
    : onObjectClick
      ? () => onObjectClick(object.id)
      : undefined;

  const style =
    editorMode && selected
      ? {
          outline: '2px solid var(--color-primary, #ff4081)',
          outlineOffset: '4px',
          cursor: 'grab',
        }
      : undefined;

  return (
    <SceneObject
      position={position}
      parallaxFactor={parallaxFactor}
      onClick={clickHandler}
      onDragStart={editorMode ? onDragStart : undefined}
      style={style}
    >
      {editorMode ? (
        <div style={{ position: 'relative' }}>
          {content}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              cursor: 'pointer',
            }}
          />
        </div>
      ) : (
        content
      )}
    </SceneObject>
  );
}

export default SavedObjectRenderer;
