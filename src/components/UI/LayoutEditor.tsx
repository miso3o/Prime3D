/**
 * LayoutEditor.tsx — raw JSON layout editor panel.
 *
 * Provides a textarea for directly editing the full layout JSON.
 * "Apply" parses the JSON and pushes the new LayoutConfig to the scene immediately.
 * "Reset to Default" restores the bundled defaultLayout.json.
 * "Load File" opens a file picker to import an external .json layout.
 *
 * This panel is for advanced users who want to edit the JSON directly.
 * For structured field editing, use the Designer Panel (✎ DESIGNER button).
 *
 * Toggle: "✎ Edit Layout" button at bottom-right of viewport.
 */
import { useState, useCallback } from 'react';
import type { LayoutConfig } from '../../config/types';
import defaultLayout from '../../config/defaultLayout.json';

interface LayoutEditorProps {
  layout: LayoutConfig;
  onApply: (next: LayoutConfig) => void;
}

const BTN_BASE: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 5,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
  fontWeight: 600,
  transition: 'opacity .15s',
};

export function LayoutEditor({ layout, onApply }: LayoutEditorProps) {
  const [open, setOpen]   = useState(false);
  const [text, setText]   = useState(() => JSON.stringify(layout, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Refresh textarea when editor is opened (picks up external changes from DesignerPanel)
  const handleOpen = useCallback(() => {
    setText(JSON.stringify(layout, null, 2));
    setError(null);
    setDirty(false);
    setOpen(true);
  }, [layout]);

  // Parse and apply the edited JSON to the scene
  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(text) as LayoutConfig;
      if (!Array.isArray(parsed.racks) || !Array.isArray(parsed.cranes) || !Array.isArray(parsed.tracks)) {
        throw new Error('JSON must have "racks", "cranes", and "tracks" arrays.');
      }
      setError(null);
      setDirty(false);
      onApply(parsed);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [text, onApply]);

  // Reset textarea to the bundled default layout
  const handleReset = useCallback(() => {
    setText(JSON.stringify(defaultLayout, null, 2));
    setError(null);
    setDirty(true);
  }, []);

  // Save current textarea content as a downloadable JSON file
  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(text); // validate before saving
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'defaultLayout.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Cannot save — JSON is invalid. Fix errors first.');
    }
  }, [text]);

  // Load a JSON file from disk into the textarea
  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        setText(raw);
        setDirty(true);
        setError(null);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setDirty(true);
    setError(null);
  }, []);

  const panelW = 480;

  return (
    <>
      {/* Toggle button — bottom-right, above designer toggle */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        style={{
          ...BTN_BASE,
          position: 'absolute',
          bottom: 55,
          right: 16,
          background: open ? '#2d3748' : '#553c9a',
          color: '#e9d8fd',
          letterSpacing: 1,
          zIndex: 6,
        }}
      >
        {open ? '✕ Close JSON' : '{ } Raw JSON'}
      </button>

      {/* Editor panel — slides in from the right */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: panelW,
            height: '100%',
            background: 'rgba(10,14,24,0.97)',
            backdropFilter: 'blur(8px)',
            borderLeft: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 11,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#e9d8fd', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              RAW JSON EDITOR
            </span>
            <span style={{ color: '#718096', fontFamily: 'monospace', fontSize: 11 }}>
              layout.json
            </span>
          </div>

          {/* Hint bar */}
          <div style={{ padding: '7px 16px', color: '#718096', fontFamily: 'monospace', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Edit directly. <b style={{ color: '#68d391' }}>Apply</b> updates the scene.
            &nbsp;Fields: <code style={{ color: '#fbd38d' }}>racks</code>,{' '}
            <code style={{ color: '#fbd38d' }}>cranes</code>,{' '}
            <code style={{ color: '#fbd38d' }}>tracks</code>,{' '}
            <code style={{ color: '#fbd38d' }}>equipment</code>,{' '}
            <code style={{ color: '#fbd38d' }}>homeStands</code>.
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={handleChange}
            spellCheck={false}
            style={{
              flex: 1,
              background: '#0d1117',
              color: '#d4e0f0',
              fontFamily: '"Cascadia Code", "Fira Code", monospace',
              fontSize: 11.5,
              lineHeight: 1.55,
              padding: '12px 16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              tabSize: 2,
              overflowY: 'auto',
            }}
          />

          {/* Error bar */}
          {error && (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(229,62,62,0.18)',
                borderTop: '1px solid rgba(229,62,62,0.3)',
                color: '#fc8181',
                fontFamily: 'monospace',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
              }}
            >
              ✗ {error}
            </div>
          )}

          {/* Action bar */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleApply}
              style={{ ...BTN_BASE, background: '#276749', color: '#c6f6d5', opacity: dirty ? 1 : 0.6 }}
            >
              ✓ Apply
            </button>
            <button
              onClick={handleSave}
              style={{ ...BTN_BASE, background: '#2b4c7e', color: '#bee3f8' }}
            >
              ↓ Save
            </button>
            <button
              onClick={handleLoad}
              style={{ ...BTN_BASE, background: '#4a3f7a', color: '#e9d8fd' }}
            >
              ↑ Load
            </button>
            <button
              onClick={handleReset}
              style={{ ...BTN_BASE, background: '#744210', color: '#fbd38d' }}
            >
              ↺ Default
            </button>
            <span style={{ marginLeft: 'auto', color: '#4a5568', fontFamily: 'monospace', fontSize: 10 }}>
              {text.split('\n').length} lines
            </span>
          </div>
        </div>
      )}
    </>
  );
}
