from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from xml.etree import ElementTree
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

import json
import re
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
# Configuration
# ---------------------------------------

ROSTER_FILE = Path(__file__).resolve().parent / "roster.json"

NFL_NEWS_FEED = "https://www.espn.com/espn/rss/nfl/news"

NEWS_CACHE_SECONDS = 900

news_cache = {
    "articles": None,
    "last_updated": 0
}


# ---------------------------------------
# Application health
# ---------------------------------------

@app.get("/")
def home():
    return {
        "message": "FantasyIQ AI backend is running!",
        "version": "0.5.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FantasyIQ AI"
    }


# ---------------------------------------
# Load your fantasy roster
# ---------------------------------------

def load_roster():

    try:
        with ROSTER_FILE.open("r", encoding="utf-8") as file:
            roster = json.load(file)

        if not isinstance(roster.get("players"), list):
            raise ValueError("Roster must contain a players list.")

        return roster

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Roster file not found. Check backend/roster.json."
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Roster file contains invalid JSON."
        )

    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=500,
            detail="Roster file has an invalid structure."
        )


@app.get("/api/roster")
def get_roster():
    return load_roster()


# ---------------------------------------
# Retrieve NFL news
# ---------------------------------------

def retrieve_nfl_news():

    request = Request(
        NFL_NEWS_FEED,
        headers={
            "User-Agent": "FantasyIQ-Development/0.5"
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
# Retrieve news with caching
# ---------------------------------------

def get_cached_news():

    current_time = time.time()

    if (
        news_cache["articles"] is not None
        and current_time - news_cache["last_updated"] < NEWS_CACHE_SECONDS
    ):
        return {
            "status": "success",
            "cached": True,
            "articles": news_cache["articles"]
        }

    try:
        articles = retrieve_nfl_news()

        if not articles:
            raise ValueError("News feed returned no articles.")

        news_cache["articles"] = articles
        news_cache["last_updated"] = current_time

        return {
            "status": "success",
            "cached": False,
            "articles": articles
        }

    except (
        HTTPError,
        URLError,
        TimeoutError,
        ElementTree.ParseError,
        ValueError
    ) as error:

        if news_cache["articles"] is not None:
            return {
                "status": "stale",
                "cached": True,
                "articles": news_cache["articles"]
            }

        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve NFL news: {str(error)}"
        )


# ---------------------------------------
# Match articles to your roster
# ---------------------------------------

def find_matching_players(article, players):

    article_text = " ".join([
        article.get("title") or "",
        article.get("description") or ""
    ])

    matches = []

    for player in players:

        player_name = player.get("name", "")

        if not player_name:
            continue

        # Match the complete player name, not fragments
        # of unrelated words or other player names.
        pattern = (
            r"(?<!\w)"
            + re.escape(player_name)
            + r"(?!\w)"
        )

        if re.search(pattern, article_text, re.IGNORECASE):
            matches.append({
                "name": player_name,
                "position": player.get("position"),
                "slot": player.get("slot"),
                "nfl_team": player.get("nfl_team")
            })

    return matches


# ---------------------------------------
# Original NFL news endpoint
# ---------------------------------------

@app.get("/api/news")
def get_nfl_news():

    news = get_cached_news()

    return {
        "status": news["status"],
        "source": "ESPN",
        "cached": news["cached"],
        "article_count": len(news["articles"]),
        "articles": news["articles"]
    }


# ---------------------------------------
# NEW: Personalized fantasy news
# ---------------------------------------

@app.get("/api/news/personalized")
def get_personalized_news():

    roster = load_roster()
    news = get_cached_news()

    players = roster["players"]

    my_team_news = []
    around_the_nfl = []

    for article in news["articles"]:

        matching_players = find_matching_players(
            article,
            players
        )

        personalized_article = {
            **article,
            "matching_players": matching_players,
            "relevant_to_my_team": len(matching_players) > 0
        }

        if matching_players:
            my_team_news.append(personalized_article)
        else:
            around_the_nfl.append(personalized_article)

    return {
        "status": news["status"],
        "team_name": roster.get("team_name", "My Fantasy Team"),
        "data_source": "ESPN RSS + Manual Roster",
        "cached": news["cached"],
        "roster_player_count": len(players),
        "total_articles": len(news["articles"]),
        "my_team_news_count": len(my_team_news),
        "my_team_news": my_team_news,
        "around_the_nfl": around_the_nfl
    }