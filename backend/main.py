from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from xml.etree import ElementTree
from datetime import datetime, timezone
from html import unescape
import time


app = FastAPI(title="FantasyIQ AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------
# Application health
# ---------------------------------------

@app.get("/")
def home():
    return {
        "message": "FantasyIQ AI backend is running!",
        "version": "0.3.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FantasyIQ AI"
    }


# ---------------------------------------
# Sample fantasy roster
# ---------------------------------------

@app.get("/api/roster")
def get_roster():
    return {
        "team_name": "Jaywesss da Bess",
        "data_source": "sample",
        "players": [
            {
                "name": "Jordan Love",
                "position": "QB",
                "projected_points": 21.4
            },
            {
                "name": "Christian McCaffrey",
                "position": "RB",
                "projected_points": 19.8
            },
            {
                "name": "Nico Collins",
                "position": "WR",
                "projected_points": 17.6
            },
            {
                "name": "Trey McBride",
                "position": "TE",
                "projected_points": 15.2
            }
        ]
    }


# ---------------------------------------
# NFL news configuration
# ---------------------------------------

NFL_NEWS_FEED = "https://www.espn.com/espn/rss/nfl/news"

# Don't repeatedly request the same news.
NEWS_CACHE_SECONDS = 900  # 15 minutes

news_cache = {
    "articles": None,
    "last_updated": 0
}


# ---------------------------------------
# Retrieve real NFL news
# ---------------------------------------

def retrieve_nfl_news():

    request = Request(
        NFL_NEWS_FEED,
        headers={
            "User-Agent": "FantasyIQ-Development/0.3"
        }
    )

    with urlopen(request, timeout=10) as response:
        xml_data = response.read()

    root = ElementTree.fromstring(xml_data)

    articles = []

    for item in root.findall("./channel/item"):

        title = item.findtext("title", default="Untitled")
        link = item.findtext("link", default="")
        description = item.findtext("description", default="")
        published = item.findtext("pubDate", default="")

        # Only include articles with valid HTTPS links.
        if not link.startswith("https://"):
            continue

        articles.append({
            "title": unescape(title),
            "source": "ESPN",
            "published": published,
            "description": unescape(description),
            "url": link
        })

    return articles[:10]


# ---------------------------------------
# News API endpoint
# ---------------------------------------

@app.get("/api/news")
def get_nfl_news():

    current_time = time.time()

    # Return cached articles when they're still fresh.
    if (
        news_cache["articles"] is not None
        and current_time - news_cache["last_updated"] < NEWS_CACHE_SECONDS
    ):
        return {
            "status": "success",
            "source": "ESPN",
            "cached": True,
            "articles": news_cache["articles"]
        }

    try:
        articles = retrieve_nfl_news()

        if not articles:
            raise ValueError("The news feed returned no articles.")

        news_cache["articles"] = articles
        news_cache["last_updated"] = current_time

        return {
            "status": "success",
            "source": "ESPN",
            "cached": False,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "article_count": len(articles),
            "articles": articles
        }

    except (HTTPError, URLError, TimeoutError, ElementTree.ParseError, ValueError) as error:

        # If the provider is temporarily unavailable,
        # return previously retrieved news when possible.
        if news_cache["articles"] is not None:
            return {
                "status": "stale",
                "source": "ESPN",
                "cached": True,
                "message": "News provider unavailable. Showing previously retrieved articles.",
                "articles": news_cache["articles"]
            }

        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve NFL news: {str(error)}"
        )