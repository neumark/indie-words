# The Most Indie Words

Which words turn up in indie lyrics far more often than in any other genre. An
[immediately.run](https://immediately.run) app, inspired by The Pudding's
[The Words That Are Most Hip Hop](https://pudding.cool/2017/09/hip-hop-words/).

Open it on [immediately.run](https://immediately.run/present/github/neumark/indie-words/main/files/src/App.tsx)

## Data

- Word counts: the [musiXmatch dataset](http://millionsongdataset.com/musixmatch/)
  (bag-of-words for 237,662 Million Song Dataset tracks; no full lyrics).
- Genre labels: the [MSD Allmusic Style Dataset](http://www.ifs.tuwien.ac.at/mir/msd/).
  "Indie" means tracks labelled Indie Pop or College Rock.
- English-language songs only, each artist capped at 20 songs per genre.
- A word's score is the share of indie songs using it at least once, divided by
  the same share for the comparison songs. Lists rank by the lower end of a 90%
  interval on that ratio.

The derived counts live in `src/data/lyrics.ts`; scores are computed in the
browser (`src/lib/page.ts`). The catalogue stops around 2010.

## Develop

```bash
npm install
npm run dev
npm run build && npm run lint
```

`src/App.tsx` is the entry point immediately.run renders. See `CLAUDE.md` for
the platform rules.
