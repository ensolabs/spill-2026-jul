# ensō Advent Arcade 2026

A winter advent calendar with 24 browser games from ensō. Throw snowballs to cool a data centre, type a combo in Code Kata, or see how high you can stack gingerbread. One game opens at midnight in Oslo each day from 1 to 24 December 2026.

[Open the calendar](https://julekalender.enso.no/)

## Run locally

From the repository root, start a static server with Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000/). Each game has its own directory. The shared menu, calendar artwork, and unlock logic live in [arcade/](arcade/).

## Publish

Publish a GitHub release for the version you want to deploy. The [Pages workflow](.github/workflows/pages.yml) packages the tagged calendar and all 24 games, then deploys them to GitHub Pages.
