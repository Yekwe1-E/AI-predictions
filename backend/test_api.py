import asyncio, sys
sys.path.insert(0, '.')
from services.football_api import fetch_real_world_matches, generate_real_fixtures_for_today_and_future

# Test built-in fixtures first (no network)
built = generate_real_fixtures_for_today_and_future()
print(f"Built-in fixtures: {len(built)}")
leagues = sorted(set(m["league"] for m in built))
print(f"Leagues in built-in ({len(leagues)}):")
for l in leagues:
    count = sum(1 for m in built if m["league"] == l)
    print(f"  {l}: {count} matches")

# Status breakdown
from collections import Counter
statuses = Counter(m["status"] for m in built)
print(f"\nStatus breakdown: {dict(statuses)}")
print(f"\nSample match: {built[0]['home_team']} vs {built[0]['away_team']} @ {built[0]['league']}")
