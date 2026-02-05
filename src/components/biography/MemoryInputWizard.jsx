import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { BiographySnapshot, SceneTemplateTypes, SceneTemplates, MoodPresets } from './biographySchema';

/**
 * MemoryInputWizard - Multi-step form for capturing life memories
 *
 * Guides users through:
 * 1. Basic memory details (who, what, when, where, feeling)
 * 2. Scene template selection
 * 3. Mood/atmosphere selection
 * 4. Character assignment
 */
export function MemoryInputWizard({ onSave, onCancel, existingSnapshot = null, characters = [] }) {
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [memoryData, setMemoryData] = useState(
    existingSnapshot || {
      title: '',
      who: '',
      what: '',
      when: '',
      where: '',
      feeling: '',
      sceneTemplate: SceneTemplateTypes.MILESTONE,
      mood: 'NOSTALGIC',
      characters: [],
      tags: [],
    }
  );

  const totalSteps = 4;

  const updateField = (field, value) => {
    setMemoryData({ ...memoryData, [field]: value });
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    const snapshot = new BiographySnapshot(memoryData);
    onSave(snapshot);
  };

  const containerStyle = {
    width: '100%',
    maxWidth: '600px',
    background: `linear-gradient(135deg, ${theme.colors.background}ee 0%, rgba(0,0,0,0.95) 100%)`,
    border: `2px solid ${theme.colors.primary}`,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: `0 0 60px ${theme.colors.shadow}`,
    fontFamily: theme.typography.fontBody,
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    padding: '12px',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    fontSize: '14px',
    marginBottom: '16px',
  };

  const buttonStyle = {
    background: theme.colors.primary,
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    color: '#fff',
    fontFamily: theme.typography.fontBody,
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
    letterSpacing: '1px',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.1)',
    color: theme.colors.text,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: theme.colors.text,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
            margin: '0 0 8px 0',
          }}
        >
          {existingSnapshot ? 'Edit Memory' : 'Capture a Memory'}
        </h2>
        <div
          style={{
            fontSize: '12px',
            color: theme.colors.textMuted,
            fontStyle: 'italic',
          }}
        >
          Step {step} of {totalSteps}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          marginBottom: '32px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(step / totalSteps) * 100}%`,
            height: '100%',
            background: theme.colors.primary,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Step Content */}
      <div style={{ minHeight: '350px' }}>
        {step === 1 && (
          <StepOne memoryData={memoryData} updateField={updateField} inputStyle={inputStyle} theme={theme} />
        )}
        {step === 2 && (
          <StepTwo memoryData={memoryData} updateField={updateField} theme={theme} />
        )}
        {step === 3 && (
          <StepThree memoryData={memoryData} updateField={updateField} theme={theme} />
        )}
        {step === 4 && (
          <StepFour memoryData={memoryData} updateField={updateField} characters={characters} theme={theme} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '32px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {step > 1 && (
            <button onClick={handlePrevious} style={secondaryButtonStyle}>
              Previous
            </button>
          )}
          <button onClick={onCancel} style={secondaryButtonStyle}>
            Cancel
          </button>
        </div>
        <div>
          {step < totalSteps ? (
            <button onClick={handleNext} style={buttonStyle}>
              Next
            </button>
          ) : (
            <button onClick={handleSave} style={buttonStyle}>
              Save Memory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Step 1: Basic Memory Details */
function StepOne({ memoryData, updateField, inputStyle, theme }) {
  return (
    <div>
      <h3
        style={{
          fontSize: '16px',
          color: theme.colors.primary,
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        The Memory
      </h3>

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        Title *
      </label>
      <input
        type="text"
        placeholder="Give your memory a title..."
        value={memoryData.title}
        onChange={(e) => updateField('title', e.target.value)}
        style={inputStyle}
      />

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        Who was there?
      </label>
      <input
        type="text"
        placeholder="Mom, Dad, my best friend Sarah..."
        value={memoryData.who}
        onChange={(e) => updateField('who', e.target.value)}
        style={inputStyle}
      />

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        What happened? *
      </label>
      <textarea
        placeholder="Describe the scene, the moment, the experience..."
        value={memoryData.what}
        onChange={(e) => updateField('what', e.target.value)}
        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
            When?
          </label>
          <input
            type="text"
            placeholder="Summer 1995, age 7..."
            value={memoryData.when}
            onChange={(e) => updateField('when', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
            Where?
          </label>
          <input
            type="text"
            placeholder="Grandma's house, the beach..."
            value={memoryData.where}
            onChange={(e) => updateField('where', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        How did it feel?
      </label>
      <input
        type="text"
        placeholder="The emotional essence: joyful, bittersweet, triumphant..."
        value={memoryData.feeling}
        onChange={(e) => updateField('feeling', e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

/** Step 2: Scene Template Selection */
function StepTwo({ memoryData, updateField, theme }) {
  return (
    <div>
      <h3
        style={{
          fontSize: '16px',
          color: theme.colors.primary,
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        Choose a Scene Type
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {Object.entries(SceneTemplates).map(([key, template]) => {
          const isSelected = memoryData.sceneTemplate === key;
          return (
            <div
              key={key}
              onClick={() => updateField('sceneTemplate', key)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  marginBottom: '8px',
                }}
              >
                {template.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: theme.colors.textMuted,
                  lineHeight: '1.4',
                }}
              >
                {template.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Step 3: Mood/Atmosphere Selection */
function StepThree({ memoryData, updateField, theme }) {
  return (
    <div>
      <h3
        style={{
          fontSize: '16px',
          color: theme.colors.primary,
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        Set the Mood
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {Object.entries(MoodPresets).map(([key, mood]) => {
          const isSelected = memoryData.mood === key;
          return (
            <div
              key={key}
              onClick={() => updateField('mood', key)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                }}
              >
                {mood.name}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginBottom: '8px' }}>
          Preview: {MoodPresets[memoryData.mood]?.name || 'Nostalgic'}
        </div>
        <div style={{ fontSize: '11px', color: theme.colors.textSubtle }}>
          Theme: {MoodPresets[memoryData.mood]?.theme || 'dreamscape'}
        </div>
      </div>
    </div>
  );
}

/** Step 4: Character Assignment */
function StepFour({ memoryData, updateField, characters, theme }) {
  const toggleCharacter = (charId) => {
    const current = memoryData.characters || [];
    const updated = current.includes(charId)
      ? current.filter((id) => id !== charId)
      : [...current, charId];
    updateField('characters', updated);
  };

  return (
    <div>
      <h3
        style={{
          fontSize: '16px',
          color: theme.colors.primary,
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        Tag Characters
      </h3>

      {characters.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: theme.colors.textMuted,
            fontSize: '13px',
          }}
        >
          No characters in your library yet. You can add them later from the character library.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {characters.map((char) => {
            const isSelected = (memoryData.characters || []).includes(char.id);
            return (
              <div
                key={char.id}
                onClick={() => toggleCharacter(char.id)}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}20)`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: char.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                >
                  {char.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.text,
                    }}
                  >
                    {char.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.colors.textMuted,
                    }}
                  >
                    {char.relationship}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>
          Tip: Build your character library to track recurring people across your life story.
        </div>
      </div>
    </div>
  );
}

export default MemoryInputWizard;
