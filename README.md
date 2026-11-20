[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hqnsyhrn/gta6-trophy-guide-01-v3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hqnsyhrn/gta6-trophy-guide-01-v3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Platinum Guide v3

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — built for the [make.fun bounty: gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Tracker** — every trophy with its official name, description and grade (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 PSN-hidden), a checklist saved in the browser, export/import JSON, and a share link that carries progress in the URL hash.
- **Cited guides** — 236 steps across all 55 trophies, every step cited, 236 of them backed by 2+ sources, drawn from 20 sources on 16 sites (PowerPyx, KeenGamer, eGamers, Exophase, PSNProfiles, PushSquare and more), all read 20 Nov 2026.
- **Honest data** — 1 possibly missable trophy, 8 on the watch list with last-chance chapters, 3 unconfirmed, and 21 disputes shown both ways with an explicit "Our call".
- **Roadmap** — 5 chapter-based stages (8/21/20/4/2 trophies), ~200 hours to platinum, difficulty 4/10, 1 playthrough, 0 online.
- **Tools** — search, filter by kind/grade/hidden/disputed, sort, spoiler shield, a missable-first Next-up planner, collectible counters for all 21 counted trophies, difficulty and time per trophy (55/55), and a source matrix.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network at run time: static files under `app/`, served with `app/` at the root.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT — see [LICENSE](LICENSE).
