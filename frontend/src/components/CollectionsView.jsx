import { useEffect, useMemo, useState } from "react";
import { C } from "../theme/palette.js";
import { Tag, ConditionBadge } from "./ui.jsx";
import { CardImage } from "./CardImage.jsx";

function CollectionCard({ experience, onViewDetail, onRemove, removeLabel }) {
  return (
    <div
      onClick={() => onViewDetail(experience)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        border: `1px solid ${C.borderLight}`,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 6px 20px rgba(61,107,78,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "none";
        event.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ height: 130, overflow: "hidden" }}>
        <CardImage experience={experience} style={{ height: 130 }} />
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>
          {experience.categoryLabel} · {experience.distance}
        </div>
        <h3
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          {experience.title}
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
          <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
          <ConditionBadge type={experience.conditionType} label={experience.condition} />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(experience.id);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "#fff",
            color: C.textSoft,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

export function CollectionsView({
  collections,
  experiences,
  onViewDetail,
  onCreateCollection,
  onAddToCollection,
  onRemoveFromCollection,
  onDeleteCollection,
}) {
  const [activeCol, setActiveCol] = useState("saved");
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!collections.some((collection) => collection.id === activeCol)) {
      setActiveCol("saved");
    }
  }, [activeCol, collections]);

  const experiencesById = useMemo(
    () => new Map(experiences.map((experience) => [experience.id, experience])),
    [experiences],
  );

  const selectedCollection = collections.find((collection) => collection.id === activeCol) ?? collections[0];
  const selectedItems = (selectedCollection?.itemIds ?? [])
    .map((id) => experiencesById.get(id))
    .filter(Boolean);

  const savedCollection = collections.find((collection) => collection.id === "saved");
  const savedItems = (savedCollection?.itemIds ?? [])
    .map((id) => experiencesById.get(id))
    .filter(Boolean);

  const availableToAdd = selectedCollection
    ? savedItems.filter((experience) => !selectedCollection.itemIds.includes(experience.id))
    : [];

  const handleCreateSubmit = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed);
    setActiveCol(`pending:${trimmed.toLowerCase()}`);
    setDraftName("");
    setIsCreating(false);
  };

  useEffect(() => {
    if (!activeCol.startsWith("pending:")) return;
    const match = collections.find(
      (collection) => collection.label.toLowerCase() === activeCol.replace("pending:", ""),
    );
    if (match) {
      setActiveCol(match.id);
    }
  }, [activeCol, collections]);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: `1px solid ${C.borderLight}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.textSoft,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            padding: "0 10px",
          }}
        >
          Collections
        </div>

        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => setActiveCol(collection.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              background: activeCol === collection.id ? C.greenLight : "transparent",
              color: activeCol === collection.id ? C.green : C.textMid,
              transition: "all 0.15s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
              {collection.icon} {collection.label}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 8,
                background: activeCol === collection.id ? C.green : C.borderLight,
                color: activeCol === collection.id ? "#fff" : C.textSoft,
              }}
            >
              {collection.itemIds.length}
            </span>
          </button>
        ))}

        {isCreating ? (
          <div
            style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 14,
              background: "#fff",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Weekend escapes"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCreateSubmit}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: C.green,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setDraftName("");
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textSoft,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            style={{
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              color: C.textSoft,
              background: "none",
              border: "none",
              textAlign: "left",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            + New collection
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, color: C.text, margin: "0 0 4px" }}>
              {selectedCollection?.icon} {selectedCollection?.label}
            </h2>
            <p style={{ fontSize: 13, color: C.textSoft }}>
              {selectedItems.length} experience{selectedItems.length !== 1 ? "s" : ""} in this collection
            </p>
          </div>
          {!["saved", "bucket"].includes(selectedCollection?.id) ? (
            <button
              type="button"
              onClick={() => onDeleteCollection(selectedCollection.id)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.textSoft,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
              }}
            >
              Delete collection
            </button>
          ) : null}
        </div>

        {selectedCollection?.id !== "saved" ? (
          <div
            style={{
              marginBottom: 24,
              padding: 18,
              borderRadius: 18,
              background: "#fff",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
              Add From Saved
            </div>
            {savedItems.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
                Save a few experiences first, then you can organize them into collections here.
              </p>
            ) : availableToAdd.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
                Everything from Saved is already in this collection.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {availableToAdd.map((experience) => (
                  <button
                    key={experience.id}
                    type="button"
                    onClick={() => onAddToCollection(selectedCollection.id, experience.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: `1px solid ${C.border}`,
                      background: C.parchment,
                      color: C.textMid,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                    }}
                  >
                    + {experience.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {selectedItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: C.textSoft }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>🌿</span>
            <p style={{ fontSize: 16, fontFamily: "'Libre Baskerville', serif" }}>
              {selectedCollection?.id === "saved" ? "Nothing saved yet" : "This collection is empty"}
            </p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              {selectedCollection?.id === "saved"
                ? "Swipe right on experiences you love"
                : "Add a few experiences from Saved to get this collection going"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {selectedItems.map((experience) => (
              <CollectionCard
                key={`${selectedCollection.id}-${experience.id}`}
                experience={experience}
                onViewDetail={onViewDetail}
                onRemove={(experienceId) => onRemoveFromCollection(selectedCollection.id, experienceId)}
                removeLabel={selectedCollection.id === "saved" ? "Remove from Saved" : "Remove from collection"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsView;
