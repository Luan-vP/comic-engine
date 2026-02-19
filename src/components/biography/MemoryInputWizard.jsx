import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { TEMPLATES, MOODS } from './biographySchema';

const STEPS = ['Details', 'Template', 'Mood', 'Characters'];

/**
 * MemoryInputWizard - 4-step controlled form for capturing a memory.
 *
 * Rendered as a position:fixed overlay (no modal library).
 * Calls onSave(snapshot) when the user finishes, or onCancel to dismiss.
 */
export function MemoryInputWizard({ initialSnapshot, characters = [], onSave, onCancel }) {
  const { theme } = useTheme();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    title: '',
    who: '',
    what: '',
    when: '',
    where: '',
    feeling: '',
    templateId: 'milestone',
    moodId: 'nostalgic',
    characterIds: [],
    ...initialSnapshot,
  });
  const [error, setError] = useState('');

  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function toggleCharacter(id) {
    setDraft((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(id)
        ? prev.characterIds.filter((c) => c !== id)
        : [...prev.characterIds, id],
    }));
  }

  function handleNext() {
    if (step === 0 && !draft.title.trim()) {
      setError('Title is required.');
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
    setError('');
  }

  function handleSave() {
    if (!draft.title.trim()) {
      setStep(0);
      setError('Title is required.');
      return;
    }
    onSave(draft);
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '8px 12px',
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    color: theme.colors.textMuted,
    fontSize: '10px',
    letterSpacing: '1px',
    marginBottom: '4px',
    fontFamily: theme.typography.fontBody,
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      {/* Dialog */}
      <div
        style={{
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '28px',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          fontFamily: theme.typography.fontBody,
          boxShadow: `0 0 60px ${theme.colors.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {initialSnapshot?.id ? 'Edit Memory' : 'New Memory'}
          </h2>
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
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: i <= step ? theme.colors.primary : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: i <= step ? '#000' : theme.colors.textSubtle,
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: '9px', color: i === step ? theme.colors.text : theme.colors.textSubtle, letterSpacing: '0.5px' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 0: Details */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>TITLE *</label>
              <input
                style={inputStyle}
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Give this memory a name"
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>WHO WAS THERE</label>
              <input
                style={inputStyle}
                value={draft.who}
                onChange={(e) => set('who', e.target.value)}
                placeholder="People present"
              />
            </div>
            <div>
              <label style={labelStyle}>WHAT HAPPENED</label>
              <textarea
                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                value={draft.what}
                onChange={(e) => set('what', e.target.value)}
                placeholder="Describe the memory"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>WHEN</label>
                <input
                  style={inputStyle}
                  value={draft.when}
                  onChange={(e) => set('when', e.target.value)}
                  placeholder="Summer 1995…"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>WHERE</label>
                <input
                  style={inputStyle}
                  value={draft.where}
                  onChange={(e) => set('where', e.target.value)}
                  placeholder="Grandma's kitchen…"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>FEELING</label>
              <input
                style={inputStyle}
                value={draft.feeling}
                onChange={(e) => set('feeling', e.target.value)}
                placeholder="How did it feel? (e.g. Wonder, Relief, Joy)"
              />
            </div>
          </div>
        )}

        {/* Step 1: Template */}
        {step === 1 && (
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: '11px', marginTop: 0 }}>
              Choose a scene type that fits this memory.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.values(TEMPLATES).map((tmpl) => {
                const active = draft.templateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => set('templateId', tmpl.id)}
                    style={{
                      background: active ? tmpl.color + '20' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${active ? tmpl.color : theme.colors.border}`,
                      borderRadius: '6px',
                      padding: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontBody,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', color: active ? tmpl.color : theme.colors.text }}>
                      {tmpl.label}
                    </div>
                    <div style={{ fontSize: '10px', color: theme.colors.textMuted, lineHeight: 1.4 }}>
                      {tmpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Mood */}
        {step === 2 && (
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: '11px', marginTop: 0 }}>
              Pick the atmosphere that best captures how this memory feels.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(MOODS).map((mood) => {
                const active = draft.moodId === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => set('moodId', mood.id)}
                    style={{
                      background: active ? theme.colors.primary + '15' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${active ? theme.colors.primary : theme.colors.border}`,
                      borderRadius: '6px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontBody,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', marginRight: '8px' }}>{mood.label}</span>
                      <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>{mood.description}</span>
                    </div>
                    {active && (
                      <span style={{ color: theme.colors.primary, fontSize: '14px' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Characters */}
        {step === 3 && (
          <div>
            <p style={{ color: theme.colors.textMuted, fontSize: '11px', marginTop: 0 }}>
              Tag people from your character library who appear in this memory.
            </p>
            {characters.length === 0 ? (
              <p style={{ color: theme.colors.textSubtle, fontSize: '11px', fontStyle: 'italic' }}>
                No characters in your library yet. You can add them from the Characters tab.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {characters.map((char) => {
                  const tagged = draft.characterIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      style={{
                        background: tagged ? char.color + '20' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${tagged ? char.color : theme.colors.border}`,
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontFamily: theme.typography.fontBody,
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: char.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: theme.colors.text, fontSize: '12px', fontWeight: tagged ? 'bold' : 'normal' }}>
                          {char.name}
                        </div>
                        {char.relationship && (
                          <div style={{ color: theme.colors.textMuted, fontSize: '10px' }}>
                            {char.relationship}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ color: '#e94560', fontSize: '11px', marginTop: '12px' }}>{error}</div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            onClick={step === 0 ? onCancel : handleBack}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.textMuted,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: theme.typography.fontBody,
            }}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              style={{
                background: theme.colors.primary,
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: theme.typography.fontBody,
              }}
            >
              Next →
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
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: theme.typography.fontBody,
              }}
            >
              Save Memory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoryInputWizard;
