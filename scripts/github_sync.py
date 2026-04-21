#!/usr/bin/env python3
"""
Fetches public repos from GitHub and optionally the contribution calendar
(requires a token for the GraphQL contribution data).

Usage:
  python scripts/github_sync.py
  python scripts/github_sync.py --token ghp_YOUR_TOKEN_HERE

Output: frontend/knowledge/github.json
"""

import json
import sys
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

GITHUB_USER = "AyushAdh1kari"
OUTPUT_PATH = Path(__file__).parent.parent / "frontend" / "knowledge" / "github.json"


def fetch_json(url, token=None, data=None, extra_headers=None):
    req = urllib.request.Request(url, data=data)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "ayush-site-sync/1.0")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def fetch_repos(token=None):
    url = (
        f"https://api.github.com/users/{GITHUB_USER}/repos"
        "?sort=updated&per_page=30&type=public"
    )
    raw = fetch_json(url, token)
    return [
        {
            "name": r["name"],
            "description": r["description"] or "",
            "url": r["html_url"],
            "language": r["language"] or "",
            "stars": r["stargazers_count"],
            "forks": r["forks_count"],
            "updated_at": r["updated_at"],
            "topics": r.get("topics", []),
        }
        for r in raw
        if not r["fork"]
    ]


def fetch_contributions(token):
    query = """{ user(login: "%s") { contributionsCollection {
      contributionCalendar { totalContributions
        weeks { contributionDays { contributionCount date } }
      }
    }}}""" % GITHUB_USER

    result = fetch_json(
        "https://api.github.com/graphql",
        token=token,
        data=json.dumps({"query": query}).encode(),
        extra_headers={"Content-Type": "application/json"},
    )
    return result["data"]["user"]["contributionsCollection"]["contributionCalendar"]


def main():
    token = None
    args = sys.argv[1:]
    if "--token" in args:
        token = args[args.index("--token") + 1]

    print(f"Syncing GitHub data for {GITHUB_USER}...")

    repos = fetch_repos(token)
    print(f"  {len(repos)} public repos fetched")

    contributions = None
    if token:
        try:
            contributions = fetch_contributions(token)
            print(f"  {contributions['totalContributions']} total contributions fetched")
        except Exception as e:
            print(f"  Contributions skipped (GraphQL error): {e}")
    else:
        print("  Skipping contribution calendar (no --token provided)")
        print("  Run with: python scripts/github_sync.py --token ghp_YOUR_TOKEN")

    output = {
        "user": GITHUB_USER,
        "synced_at": datetime.utcnow().isoformat() + "Z",
        "repos": repos,
        "contributions": contributions,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\nSaved → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
