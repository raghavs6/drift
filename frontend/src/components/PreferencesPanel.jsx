import { useEffect, useState } from "react";
import { C } from "../theme/palette.js";
import {
  AGES,
  COMFORT,
  DEFAULT_LOCATION,
  DISTANCES,
} from "../lib/appConstants.js";

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: C.textSoft,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        background: "#fff",
        color: C.text,
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function PreferencesPanel({
  open,
  prefs,
  locationOptions,
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(prefs);

  useEffect(() => {
    setDraft(prefs);
  }, [prefs, open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 32,
        width: 360,
        zIndex: 70,
        borderRadius: 24,
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${C.borderLight}`,
        boxShadow: "0 18px 50px rgba(61,107,78,0.16)",
        backdropFilter: "blur(18px)",
        padding: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: C.text }}>
            Preferences
          </div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4 }}>
            Tune your feed without restarting onboarding.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            color: C.textSoft,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <FieldLabel>Location</FieldLabel>
          <SelectField
            value={draft.location || DEFAULT_LOCATION}
            onChange={(value) => setDraft((current) => ({ ...current, location: value }))}
            options={locationOptions.length ? locationOptions : [DEFAULT_LOCATION]}
          />
        </div>

        <div>
          <FieldLabel>Max Travel Distance</FieldLabel>
          <SelectField
            value={draft.distance}
            onChange={(value) => setDraft((current) => ({ ...current, distance: value }))}
            options={DISTANCES}
          />
        </div>

        <div>
          <FieldLabel>Age Range</FieldLabel>
          <SelectField
            value={draft.age}
            onChange={(value) => setDraft((current) => ({ ...current, age: value }))}
            options={AGES}
          />
        </div>

        <div>
          <FieldLabel>Comfort Level</FieldLabel>
          <SelectField
            value={draft.comfort}
            onChange={(value) => setDraft((current) => ({ ...current, comfort: value }))}
            options={COMFORT.map((option) => option.label)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button
          type="button"
          onClick={() => {
            onSave(draft);
            onClose();
          }}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 14,
            border: "none",
            background: C.green,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(prefs);
            onClose();
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "#fff",
            color: C.textMid,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PreferencesPanel;
