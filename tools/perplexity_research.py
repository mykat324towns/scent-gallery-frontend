#!/usr/bin/env python3
"""
Perplexity research tool for Scent Gallery EA.
Runs context-aware deep research via the Perplexity API.

Usage:
    python tools/perplexity_research.py "your research query"
    python tools/perplexity_research.py "query" --depth deep
    python tools/perplexity_research.py "query" --no-context
"""

import argparse
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load .env from project root
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

API_KEY = os.getenv("PERPLEXITY_API_KEY")
API_URL = "https://api.perplexity.ai/chat/completions"

CONTEXT_FILES = {
    "Current Priorities": ROOT / "context" / "current-priorities.md",
    "Goals": ROOT / "context" / "goals.md",
    "Business": ROOT / "context" / "work.md",
    "About Me": ROOT / "context" / "me.md",
}

SYSTEM_PROMPT = """You are a research assistant for Jaxson Yancy, the solo CEO of Scent Gallery — a DTC ecommerce store selling luxury fragrance decants (1ml–30ml sample sizes of high-end colognes) on WooCommerce/WordPress.

Key context:
- Primary growth channel: Meta ads
- Current focus: Website CRO, fragrance restocking, cold audience video creative
- Goals: 4%+ conversion rate, 4 consistent orders/day
- Constraints: Solo operator, low inventory, limited cash to restock

When responding:
- Be specific and actionable — not theoretical
- Frame everything through the lens of a small, solo-run DTC brand
- Prioritize high-leverage, low-cost actions given resource constraints
- Structure output clearly with headers

{context}"""


def load_context() -> str:
    sections = []
    for label, path in CONTEXT_FILES.items():
        if path.exists():
            content = path.read_text(encoding="utf-8").strip()
            if content:
                sections.append(f"### {label}\n{content}")
    if not sections:
        return ""
    return "\n\nCurrent business context:\n" + "\n\n".join(sections)


def run_research(query: str, depth: str = "standard", include_context: bool = True) -> str:
    if not API_KEY or API_KEY == "your_key_here":
        sys.exit("Error: PERPLEXITY_API_KEY not set in .env — open .env and paste your key.")

    context_block = load_context() if include_context else ""
    system_prompt = SYSTEM_PROMPT.format(context=context_block)
    model = "sonar-pro" if depth == "deep" else "sonar"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        "return_citations": True,
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    response = requests.post(API_URL, json=payload, headers=headers, timeout=60)
    response.raise_for_status()

    data = response.json()
    content = data["choices"][0]["message"]["content"]

    citations = data.get("citations", [])
    if citations:
        content += "\n\n---\n**Sources:**\n"
        for i, url in enumerate(citations, 1):
            content += f"{i}. {url}\n"

    return content


def main():
    parser = argparse.ArgumentParser(description="Context-aware research via Perplexity")
    parser.add_argument("query", help="Research question or topic")
    parser.add_argument(
        "--depth",
        choices=["standard", "deep"],
        default="standard",
        help="standard = sonar (fast), deep = sonar-pro (thorough)",
    )
    parser.add_argument(
        "--no-context",
        action="store_true",
        help="Skip injecting business context — raw search mode",
    )
    args = parser.parse_args()

    result = run_research(args.query, depth=args.depth, include_context=not args.no_context)
    print(result)


if __name__ == "__main__":
    main()
