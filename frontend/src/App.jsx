const productHighlights = [
  "Swipe-based discovery for outdoor experiences",
  "Real-time condition-aware recommendations",
  "Preference learning from onboarding and swipes",
  "Collections for saved experiences",
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Hackathon MVP</p>
        <h1>Drift</h1>
        <p className="tagline">
          Discover outdoor experiences nearby that actually make sense right now.
        </p>
      </section>

      <section className="card">
        <h2>Planned experience flow</h2>
        <ol>
          <li>Collect onboarding preferences in under 20 seconds.</li>
          <li>Build a ranked stack of nearby experiences.</li>
          <li>Let users swipe left, right, or open detail view.</li>
          <li>Save right swipes into collections and learn preferences over time.</li>
        </ol>
      </section>

      <section className="card">
        <h2>MVP pillars</h2>
        <ul>
          {productHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
