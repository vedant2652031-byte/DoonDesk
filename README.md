# DS-Agent

Ask anything about **The Doon School, Dehradun**: admissions, houses, staff, the Autumn Term 2026 calendar, sport, Midterms, traditions and famous Old Boys, and get a clear answer straight away.

**Live site:** https://vedant2652031-byte.github.io/doon-agent-site/ (classic version: [/classic/](https://vedant2652031-byte.github.io/doon-agent-site/classic/))

DS-Agent is a single web page with a built-in knowledge base, so it runs in any browser with no server, no sign-up and no API key.

> DS-Agent is an independent student project. It is not an official publication of The Doon School. For anything important (fees, dates, admissions) confirm with the school at [doonschool.com](https://www.doonschool.com).

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | **DS-Agent Pro**: the main site. Blue-and-black liquid-glass design, login page, floating glass bubbles, scroll animations, works on phones, tablets and computers. |
| `classic/index.html` | **DS-Agent (classic)**: the first version, with the original design. |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are. |

## Use it

- **On your computer:** download `index.html` and double-click it.
- **As a website (free):** in this repo go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, and save. After a minute your site is live at `https://<your-username>.github.io/<repo-name>/`, and the classic version is at `…/classic/`.

## What it can answer

- **The school:** history and timeline, founder, all 11 Headmasters, motto and the aristocracy of service, campus, the Main Building, Kilachand Library, sustainability
- **People:** the leadership team (including the Bursar), the Board of Governors, every house's Housemaster and Assistant Housemaster, teachers by subject, staff initials (try "Who is SKD?"), masters-in-charge of societies, activities and sports
- **Houses:** all seven houses, how boys are placed, holding houses, inter-house competitions
- **Admissions:** ages, the entrance test and group discussion, preparation, bursaries, fees, visits
- **Life at Doon:** daily routine, academics and subjects, results, sport, Midterms, clubs, publications, service, Founder's Day
- **Autumn Term 2026 calendar:** every key date, plus "What's coming up next?", which works out upcoming events from today's date
- **Old Boys:** about 50 notable alumni by field, and any of them by name

Each answer shows where its information came from and suggests follow-up questions.

## How answers work

- **School notes (always on):** DS-Agent matches your question against its knowledge base and answers instantly. It works offline and anywhere.
- **AI (only inside Claude):** when the page is opened inside Claude and the notes don't cover a question, it asks Claude, giving it the school notes to work from.

## Accounts

The login page stores accounts **only in the browser they were created in**. Passwords are scrambled with PBKDF2 and never stored as plain text, and each person's chats are kept separately. There's no server, so an account made on one device doesn't exist on another. "Continue as guest" skips sign-in.

## Updating the information

The knowledge base lives inside each HTML file between the `/*ENGINE-START*/` and `/*ENGINE-END*/` markers. Each topic is one entry with a title, keywords, example questions, the answer, and its sources.

## Sources

- [doonschool.com](https://www.doonschool.com) and its 2025–26 School Profile
- Doon School Compendium (V2)
- The Doon School Calendar: Autumn Term 2026
- Notable Doon School Alumni (Old Boys) V3
- [Wikipedia: The Doon School](https://en.wikipedia.org/wiki/The_Doon_School), for a few gaps
