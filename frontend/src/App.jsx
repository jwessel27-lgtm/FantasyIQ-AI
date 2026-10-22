import { useState } from 'react'
import './App.css'

function App() {
  const [activeFeature, setActiveFeature] = useState(null)

  const features = [
    {
      id: 'news',
      title: 'News For Me',
      description: 'Injuries, updates, and news affecting your fantasy team.',
      icon: '📰',
    },
    {
      id: 'trades',
      title: 'Best Trades',
      description: 'Find realistic trades that benefit both teams.',
      icon: '🤝',
    },
    {
      id: 'waivers',
      title: 'Waiver Wire',
      description: 'Discover available players worth considering.',
      icon: '📈',
    },
    {
      id: 'lineup',
      title: 'Lineup Analysis',
      description: 'Review your starters and upcoming matchups.',
      icon: '🏈',
    },
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>🏈 FantasyIQ AI</h1>
        <p>Your Fantasy Football Research Assistant</p>
      </header>

      <main className="dashboard">
        <h2>Welcome to FantasyIQ</h2>
        <p className="subtitle">
          You make the decisions. We do the homework.
        </p>

        <div className="feature-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              className="feature-card"
              onClick={() => setActiveFeature(feature)}
            >
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </button>
          ))}
        </div>

        {activeFeature && (
          <div className="feature-panel">
            <h2>{activeFeature.icon} {activeFeature.title}</h2>
            <p>
              This feature is coming soon!
              We'll connect it to real Yahoo Fantasy data later.
            </p>
            <button onClick={() => setActiveFeature(null)}>
              Close
            </button>
          </div>
        )}
      </main>

      <footer>
        <p>FantasyIQ AI | Development Version 0.1</p>
      </footer>
    </div>
  )
}

export default App