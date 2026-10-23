import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

const features = [
  {
    id: 'news',
    title: 'News For Me',
    description: 'NFL news personalized to your fantasy roster.',
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

function App() {
  const [activeFeature, setActiveFeature] = useState(null)
  const [backendStatus, setBackendStatus] = useState('Checking...')

  const [roster, setRoster] = useState(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState(null)

  const [news, setNews] = useState(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Backend unavailable')
        }
        return response.json()
      })
      .then((data) => {
        setBackendStatus(
          data.status === 'healthy'
            ? 'Connected 🟢'
            : 'Unavailable 🔴'
        )
      })
      .catch(() => setBackendStatus('Disconnected 🔴'))
  }, [])

  async function fetchRoster() {
    setRosterLoading(true)
    setRosterError(null)
    setRoster(null)

    try {
      const response = await fetch(`${API_URL}/api/roster`)

      if (!response.ok) {
        throw new Error('Unable to retrieve roster')
      }

      setRoster(await response.json())
    } catch (error) {
      setRosterError(error.message)
    } finally {
      setRosterLoading(false)
    }
  }

  async function fetchNews() {
    setNewsLoading(true)
    setNewsError(null)
    setNews(null)

    try {
      const response = await fetch(
        `${API_URL}/api/news/personalized`
      )

      if (!response.ok) {
        throw new Error('Unable to retrieve personalized NFL news')
      }

      setNews(await response.json())
    } catch (error) {
      setNewsError(error.message)
    } finally {
      setNewsLoading(false)
    }
  }

  function handleFeatureClick(feature) {
    setActiveFeature(feature)

    if (feature.id === 'news') {
      fetchNews()
    }

    if (feature.id === 'lineup') {
      fetchRoster()
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'Date unavailable'

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return dateString
    }

    return date.toLocaleString()
  }

  function NewsCard({ article }) {
    return (
      <div
        style={{
          backgroundColor: '#162238',
          border: '1px solid #2c405c',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {article.title}
        </h3>

        {article.matching_players?.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {article.matching_players.map((player) => (
              <span
                key={player.name}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#164e63',
                  color: '#67e8f9',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  marginRight: '8px',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                🏈 {player.name} ({player.position})
              </span>
            ))}
          </div>
        )}

        <p
          style={{
            fontSize: '13px',
            opacity: 0.7,
            marginBottom: '12px',
          }}
        >
          📰 {article.source} | 🕒{' '}
          {formatDate(article.published)}
        </p>

        {article.description &&
          article.description !== 'null' && (
            <p style={{ lineHeight: '1.6' }}>
              {article.description}
            </p>
          )}

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#38bdf8',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Read Full Article →
        </a>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏈 FantasyIQ AI</h1>
        <p>Your Fantasy Football Research Assistant</p>
        <p>Backend: {backendStatus}</p>
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
              onClick={() => handleFeatureClick(feature)}
            >
              <span className="feature-icon">
                {feature.icon}
              </span>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </button>
          ))}
        </div>

        {activeFeature && (
          <div className="feature-panel">
            <h2>
              {activeFeature.icon} {activeFeature.title}
            </h2>

            {/* PERSONALIZED NEWS */}

            {activeFeature.id === 'news' && (
              <div>
                {newsLoading && (
                  <p>🔄 Checking NFL news against your roster...</p>
                )}

                {newsError && (
                  <p>❌ Error: {newsError}</p>
                )}

                {news && (
                  <>
                    <h3>{news.team_name}</h3>

                    <p>
                      🏈 {news.roster_player_count} roster entries
                      {' | '}
                      📰 {news.total_articles} articles checked
                    </p>

                    {news.status === 'stale' && (
                      <p>
                        ⚠️ ESPN is temporarily unavailable.
                        Showing previously retrieved news.
                      </p>
                    )}

                    <section style={{ marginTop: '30px' }}>
                      <h2>
                        🚨 My Team News ({news.my_team_news_count})
                      </h2>

                      {news.my_team_news.length === 0 ? (
                        <p>
                          No direct mentions of your players in
                          the articles currently checked.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gap: '16px',
                            marginTop: '16px',
                          }}
                        >
                          {news.my_team_news.map((article, index) => (
                            <NewsCard
                              key={`${article.url}-${index}`}
                              article={article}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    <section style={{ marginTop: '40px' }}>
                      <h2>
                        📰 Around the NFL ({news.around_the_nfl.length})
                      </h2>

                      <div
                        style={{
                          display: 'grid',
                          gap: '16px',
                          marginTop: '16px',
                        }}
                      >
                        {news.around_the_nfl.map((article, index) => (
                          <NewsCard
                            key={`${article.url}-${index}`}
                            article={article}
                          />
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

            {/* LINEUP ANALYSIS */}

            {activeFeature.id === 'lineup' && (
              <>
                {rosterLoading && <p>Loading roster...</p>}

                {rosterError && (
                  <p>❌ Error: {rosterError}</p>
                )}

                {roster && (
                  <>
                    <h3>{roster.team_name}</h3>

                    <p>
                      Data Source: {roster.data_source}
                    </p>

                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '20px',
                        textAlign: 'left',
                      }}
                    >
                      <thead>
                        <tr>
                          <th>Slot</th>
                          <th>Position</th>
                          <th>Player</th>
                          <th>NFL Team</th>
                        </tr>
                      </thead>

                      <tbody>
                        {roster.players.map((player, index) => (
                          <tr key={index}>
                            <td style={{ padding: '12px' }}>
                              {player.slot}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {player.position}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {player.name}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {player.nfl_team}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            {/* COMING SOON */}

            {activeFeature.id !== 'news' &&
              activeFeature.id !== 'lineup' && (
                <p>
                  This feature is coming soon!
                </p>
              )}

            <button
              onClick={() => setActiveFeature(null)}
              style={{
                marginTop: '24px',
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </main>

      <footer>
        <p>FantasyIQ AI | Development Version 0.5</p>
      </footer>
    </div>
  )
}

export default App