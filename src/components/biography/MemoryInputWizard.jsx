import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { TEMPLATES, MOODS, createSnapshot } from './biographySchema';

const STEPS = ['Details', 'Template', 'Mood', 'Characters'];

/**
 * MemoryInputWizard - A 4-step controlled form for capturing a new memory.
 *
 * Renders as a fixed overlay (position: fixed) so it sits above the scene.
 * No modal library — matches the styling used elsewhere in the project.
 *
 * Props:
 *  - characters: Character[] — available characters to tag
 *  - initial: snapshot object for edit mode (optional)
 *  - onSave(snapshot): called when the user completes the wizard
 *  - onCancel(): called when the user dismisses the wizard
 */
export function MemoryInputWizard({ characters = [], initial = null, onSave, onCancel }) {
  const { theme } = useTheme();

  const [step, setStep] = useState(0);
  const [data, setData] = useState(
    initial
      ? { ...initial }
      : {
          title: '',
          who: '',
          what: '',
          when: '',
          where: '',
          feeling: '',
          template: 'milestone',
          mood: 'nostalgic',
          characterIds: [],
        }
  );

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCharacter(id) {
    setData((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(id)
        ? prev.characterIds.filter((c) => c !== id)
        : [...prev.characterIds, id],
    }));
  }

  function handleSave() {
    const snapshot = initial
      ? { ...initial, ...data }
      : createSnapshot(data);
    onSave(snapshot);
  }

  const isStep1Valid = data.title.trim().length > 0;

  // Shared input style
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '8px 10px',
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    color: theme.colors.textMuted,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    /* Overlay backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fontBody,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Dialog card */}
      <div
        style={{
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `0 20px 60px ${theme.colors.shadow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                color: theme.colors.primary,
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              {initial ? 'Edit Memory' : 'New Memory'}
            </div>
            <h2
              style={{
                margin: 0,
                color: theme.colors.text,
                fontSize: '18px',
                fontFamily: theme.typography.fontDisplay,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {STEPS[step]}
            </h2>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textMuted,
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Progress dots */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: i <= step ? theme.colors.primary : theme.colors.border,
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              />
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: i < step ? theme.colors.primary : theme.colors.border,
                    transition: 'background 0.2s',
                  }}
                />
              )}
            </React.Fragment>
          ))}
          <span
            style={{
              color: theme.colors.textMuted,
              fontSize: '10px',
              marginLeft: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div style={{ padding: '16px 24px 24px' }}>
          {step === 0 && (
            <StepDetails data={data} update={update} inputStyle={inputStyle} labelStyle={labelStyle} />
          )}
          {step === 1 && (
            <StepTemplate data={data} update={update} theme={theme} />
          )}
          {step === 2 && (
            <StepMood data={data} update={update} theme={theme} />
          )}
          {step === 3 && (
            <StepCharacters
              data={data}
              characters={characters}
              toggleCharacter={toggleCharacter}
              theme={theme}
            />
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.text,
              padding: '8px 16px',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: theme.typography.fontBody,
            }}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !isStep1Valid}
              style={{
                background: step === 0 && !isStep1Valid ? theme.colors.border : theme.colors.primary,
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                padding: '8px 20px',
                fontSize: '11px',
                cursor: step === 0 && !isStep1Valid ? 'not-allowed' : 'pointer',
                fontFamily: theme.typography.fontBody,
                fontWeight: 'bold',
                letterSpacing: '1px',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={{
                background: theme.colors.primary,
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                padding: '8px 20px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: theme.typography.fontBody,
                fontWeight: 'bold',
                letterSpacing: '1px',
              }}
            >
              {initial ? 'Update' : 'Save Memory'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step sub-components
// ---------------------------------------------------------------------------

function StepDetails({ data, update, inputStyle, labelStyle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          style={inputStyle}
          placeholder="A name for this memory…"
          value={data.title}
          onChange={(e) => update('title', e.target.value)}
          autoFocus
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Who was there?</label>
          <input
            style={inputStyle}
            placeholder="People present…"
            value={data.who}
            onChange={(e) => update('who', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>When?</label>
          <input
            style={inputStyle}
            placeholder="Year, season, age…"
            value={data.when}
            onChange={(e) => update('when', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Where?</label>
        <input
          style={inputStyle}
          placeholder="Location or setting…"
          value={data.where}
          onChange={(e) => update('where', e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>What happened?</label>
        <textarea
          style={{ ...inputStyle, height: '64px', resize: 'vertical' }}
          placeholder="Briefly describe the memory…"
          value={data.what}
          onChange={(e) => update('what', e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>How did it feel?</label>
        <input
          style={inputStyle}
          placeholder="The emotional essence…"
          value={data.feeling}
          onChange={(e) => update('feeling', e.target.value)}
        />
      </div>
    </div>
  );
}

function StepTemplate({ data, update, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: '0 0 12px', color: theme.colors.textMuted, fontSize: '12px' }}>
        Choose the type of scene that best fits this memory.
      </p>
      {Object.values(TEMPLATES).map((t) => (
        <button
          key={t.id}
          onClick={() => update('template', t.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: data.template === t.id ? `${t.color}18` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${data.template === t.id ? t.color : theme.colors.border}`,
            borderRadius: '6px',
            padding: '10px 14px',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: theme.typography.fontBody,
            transition: 'all 0.15s',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: t.color,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ color: theme.colors.text, fontSize: '12px', fontWeight: 'bold' }}>
              {t.label}
            </div>
            <div style={{ color: theme.colors.textMuted, fontSize: '11px' }}>{t.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function StepMood({ data, update, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: '0 0 12px', color: theme.colors.textMuted, fontSize: '12px' }}>
        Select the atmosphere for this memory.
      </p>
      {Object.values(MOODS).map((m) => (
        <button
          key={m.id}
          onClick={() => update('mood', m.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: data.mood === m.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${data.mood === m.id ? theme.colors.primary : theme.colors.border}`,
            borderRadius: '6px',
            padding: '10px 14px',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: theme.typography.fontBody,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ color: theme.colors.text, fontSize: '12px', fontWeight: 'bold' }}>
              {m.label}
            </div>
            <div style={{ color: theme.colors.textMuted, fontSize: '11px' }}>{m.description}</div>
          </div>
          <div
            style={{
              fontSize: '9px',
              color: theme.colors.textSubtle,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {m.theme}
          </div>
        </button>
      ))}
    </div>
  );
}

function StepCharacters({ data, characters, toggleCharacter, theme }) {
  if (characters.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ color: theme.colors.textMuted, fontSize: '12px', margin: 0 }}>
          No characters yet. Add characters from the Characters tab, then come back to tag them.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: '0 0 12px', color: theme.colors.textMuted, fontSize: '12px' }}>
        Tag people who appear in this memory.
      </p>
      {characters.map((c) => {
        const selected = data.characterIds.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => toggleCharacter(c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected ? c.color : theme.colors.border}`,
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontFamily: theme.typography.fontBody,
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: c.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: theme.colors.text, fontSize: '12px' }}>{c.name}</div>
              {c.relationship && (
                <div style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
                  {c.relationship}
                </div>
              )}
            </div>
            {selected && (
              <span style={{ color: c.color, fontSize: '14px' }}>&#10003;</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default MemoryInputWizard;
