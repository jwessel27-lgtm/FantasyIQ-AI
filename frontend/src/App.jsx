import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

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
      .catch(() => {
        setBackendStatus('Disconnected 🔴')
      })
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

      const data = await response.json()
      setRoster(data)
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
      const response = await fetch(`${API_URL}/api/news`)

      if (!response.ok) {
        throw new Error('Unable to retrieve NFL news')
      }

      const data = await response.json()
      setNews(data)
    } catch (error) {
      setNewsError(error.message)
    } finally {
      setNewsLoading(false)
    }
  }

  function handleFeatureClick(feature) {
    setActiveFeature(feature)

    if (feature.id === 'lineup') {
      fetchRoster()
    }

    if (feature.id === 'news') {
      fetchNews()
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return 'Date unavailable'
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return dateString
    }

    return date.toLocaleString()
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

            {/* NEWS FOR ME */}

            {activeFeature.id === 'news' && (
              <div>
                {newsLoading && (
                  <p>🔄 Retrieving the latest NFL news...</p>
                )}

                {newsError && (
                  <p>❌ Error: {newsError}</p>
                )}

                {news && (
                  <>
                    <p>
                      Source: {news.source} | Articles:{' '}
                      {news.articles.length}
                    </p>

                    {news.status === 'stale' && (
                      <p>
                        ⚠️ Showing cached news because the
                        provider is temporarily unavailable.
                      </p>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gap: '16px',
                        marginTop: '24px',
                      }}
                    >
                      {news.articles.map((article, index) => (
                        <div
                          key={`${article.url}-${index}`}
                          style={{
                            backgroundColor: '#162238',
                            border: '1px solid #2c405c',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'left',
                          }}
                        >
                          <h3
                            style={{
                              marginTop: 0,
                              marginBottom: '12px',
                            }}
                          >
                            {article.title}
                          </h3>

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
                              <p
                                style={{
                                  lineHeight: '1.6',
                                  marginBottom: '16px',
                                }}
                              >
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
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* LINEUP ANALYSIS */}

            {activeFeature.id === 'lineup' && (
              <>
                {rosterLoading && (
                  <p>Loading roster...</p>
                )}

                {rosterError && (
                  <p>❌ Error: {rosterError}</p>
                )}

                {roster && (
                  <>
                    <h3>{roster.team_name}</h3>

                    <p>Data Source: {roster.data_source}</p>

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
                          <th>Position</th>
                          <th>Player</th>
                          <th>Projected Points</th>
                        </tr>
                      </thead>

                      <tbody>
                        {roster.players.map((player, index) => (
                          <tr key={index}>
                            <td style={{ padding: '12px' }}>
                              {player.position}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {player.name}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {player.projected_points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}

            {/* FEATURES COMING LATER */}

            {activeFeature.id !== 'news' &&
              activeFeature.id !== 'lineup' && (
                <p>
                  This feature is coming soon! We'll connect
                  it to real fantasy data later.
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
        <p>FantasyIQ AI | Development Version 0.3</p>
      </footer>
    </div>
  )
}

export default App