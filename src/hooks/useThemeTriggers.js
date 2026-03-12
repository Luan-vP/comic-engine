import { useReducer, useCallback, useEffect, useRef } from 'react';

/**
 * useThemeTriggers — Evaluates theme triggers based on scrollZ and object clicks.
 *
 * Trigger shapes in sceneConfig.theme.triggers:
 *   { type: 'zDepth', zThreshold: 500, direction: 'forward'|'backward'|'both', theme: 'cyberpunk', overlayOverrides: {} }
 *   { type: 'objectClick', objectId: 'door-1', theme: 'dreamscape', overlayOverrides: {} }
 *
 * Priority: clickTriggered > zTriggered > base
 */

function reducer(state, action) {
  switch (action.type) {
    case 'Z_TRIGGER':
      if (state.zTheme === action.theme) return state;
      return { ...state, zTheme: action.theme, zOverrides: action.overlayOverrides || {} };
    case 'OBJECT_CLICK':
      if (state.clickTheme === action.theme) {
        return { ...state, clickTheme: null, clickOverrides: {} };
      }
      return { ...state, clickTheme: action.theme, clickOverrides: action.overlayOverrides || {} };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState = { zTheme: null, zOverrides: {}, clickTheme: null, clickOverrides: {} };
const EMPTY_TRIGGERS = [];
const EMPTY_OVERLAYS = {};

export function useThemeTriggers({ triggers, scrollZ = 0, baseTheme, baseOverlays } = {}) {
  const safeTriggers = triggers || EMPTY_TRIGGERS;
  const safeOverlays = baseOverlays || EMPTY_OVERLAYS;

  const [state, dispatch] = useReducer(reducer, initialState);

  // Reset when triggers array identity changes (new scene loaded)
  const prevTriggersRef = useRef(safeTriggers);
  useEffect(() => {
    if (prevTriggersRef.current !== safeTriggers) {
      prevTriggersRef.current = safeTriggers;
      dispatch({ type: 'RESET' });
    }
  }, [safeTriggers]);

  // Evaluate z-depth triggers on every scrollZ change
  useEffect(() => {
    const zTriggers = safeTriggers.filter((t) => t.type === 'zDepth');
    if (!zTriggers.length) {
      dispatch({ type: 'Z_TRIGGER', theme: null, overlayOverrides: {} });
      return;
    }

    let activeTrigger = null;
    for (const trigger of zTriggers) {
      const crossed =
        trigger.direction === 'backward'
          ? scrollZ <= trigger.zThreshold
          : scrollZ >= trigger.zThreshold;
      if (crossed) {
        if (!activeTrigger || trigger.zThreshold > activeTrigger.zThreshold) {
          activeTrigger = trigger;
        }
      }
    }

    dispatch({
      type: 'Z_TRIGGER',
      theme: activeTrigger?.theme || null,
      overlayOverrides: activeTrigger?.overlayOverrides || {},
    });
  }, [scrollZ, safeTriggers]);

  const handleObjectClick = useCallback(
    (objectId) => {
      const trigger = safeTriggers.find((t) => t.type === 'objectClick' && t.objectId === objectId);
      if (trigger) {
        dispatch({
          type: 'OBJECT_CLICK',
          theme: trigger.theme,
          overlayOverrides: trigger.overlayOverrides,
        });
      }
    },
    [safeTriggers],
  );

  const activeThemeName = state.clickTheme ?? state.zTheme ?? baseTheme;
  const activeOverlays = {
    ...safeOverlays,
    ...state.zOverrides,
    ...state.clickOverrides,
  };

  return { activeThemeName, activeOverlays, handleObjectClick };
}
