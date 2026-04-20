# Research Skill

Context-aware deep research using Perplexity AI. Every query is automatically enriched with Scent Gallery's current priorities, goals, and business context — so results come back relevant to the actual situation, not generic.

## When to Trigger

Use this skill when the user asks to:
- Research a topic, trend, competitor, or strategy
- Find fragrance trends, supplier options, or market data
- Look up CRO best practices, ad creative benchmarks, Meta ads updates
- Investigate anything where current web data matters
- Validate an idea or assumption against real-world information

## Step-by-Step

1. **Understand the query** — Identify exactly what Jaxson is trying to learn and why
2. **Check relevance to active projects** — Glance at `context/current-priorities.md` and `projects/` to see if this connects to ongoing work
3. **Run the tool** — Execute the appropriate command below
4. **Present findings** — Always reframe results through the lens of Scent Gallery. Don't just dump output — add a "What This Means for You" layer

## Tool Commands

Standard research (most queries — fast):
```bash
python tools/perplexity_research.py "your query here"
```

Deep research (complex strategy, competitive analysis, multi-part questions):
```bash
python tools/perplexity_research.py "your query here" --depth deep
```

Raw search (when Jaxson explicitly wants unfiltered results):
```bash
python tools/perplexity_research.py "your query here" --no-context
```

## Output Structure

Always format research results as:

1. **Key Findings** — 3–5 bullets, most important first
2. **What This Means for Scent Gallery** — Direct application to Jaxson's situation and current priorities
3. **Recommended Next Steps** — Concrete actions, highest-leverage first
4. **Sources** — Included automatically by the tool

## Requirements

- `PERPLEXITY_API_KEY` must be set in `.env`
- Python dependencies installed: `pip install -r requirements.txt`
