# DoonDesk

Ask anything about **The Doon School, Dehradun**: admissions, houses, staff, the Autumn Term 2026 calendar, sport, Midterms, traditions and famous Old Boys, and get a clear answer straight away.

**Live site:** https://vedant2652031-byte.github.io/ds-agent-pro/ (classic version: [/classic/](https://vedant2652031-byte.github.io/ds-agent-pro/classic/))

DoonDesk is a single web page with a built-in knowledge base, so it runs in any browser with no server, no sign-up and no API key.

> DoonDesk is an independent student project. It is not an official publication of The Doon School. For anything important (fees, dates, admissions) confirm with the school at [doonschool.com](https://www.doonschool.com).

## What's in this repo

| File | What it is |
|---|---|
| `index.html` | **DoonDesk**: the main site. Blue-and-black liquid-glass design, login page, floating glass bubbles, scroll animations, works on phones, tablets and computers. |
| `classic/index.html` | **DoonDesk Classic**: the earlier version, with the original design. |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are. |

## Use it

- **On your computer:** download `index.html` and double-click it.
- **As a website (free):** in this repo go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, and save. After a minute your site is live at `https://<your-username>.github.io/ds-agent-pro/`, and the classic version is at `…/classic/`.

## What it can answer

- **The school:** history and timeline, founder, all 11 Headmasters, motto and the aristocracy of service, campus, the Main Building, Kilachand Library, sustainability
- **People:** the leadership team (including the Bursar), the Board of Governors, every house's Housemaster, Assistant Housemaster and Dame, teachers by subject, staff initials (try "Who is SKD?"), masters-in-charge of societies, activities and sports
- **Houses:** all seven houses with their colours, mottos, locations, staff, Dames and room layouts; holding houses; house words like toye and caudi; how the inter-house cups and points work
- **Admissions:** ages, the entrance test and group discussion, preparation, bursaries, fees, visits
- **Life at Doon:** forms (D to SC), the two terms, daily routine, academics, departments and subjects, results, sport and facilities, Midterms, clubs, activities and publications, Centres of Excellence, service, pastoral care and who to contact, keeping in touch with parents, Founder's Day and special programmes
- **Campus:** the Main Field and Skinners, the Sports Complex, CDH, MDH and Café Aqueduct, the BML Munjal Auditorium, the Kilachand Library and the Wellness Centre
- **Autumn Term 2026 calendar:** every key date, plus "What's coming up next?", which works out upcoming events from today's date
- **Old Boys:** about 50 notable alumni by field, and any of them by name
- **Student leaders 2026–27:** the School Captains, each house's House Captain and prefects, sports captains, students-in-charge of activities, music, SUPW, clubs and societies, and the editors of every publication. Ask by role ("Who is the cricket captain?") or by name
- **Masters-in-charge:** ask about one sport or activity ("Who is in charge of cricket?") to get just its masters, with the student captain
- **Basic conversation:** greetings, "how are you", jokes, fun facts about Doon, and more
- **Thinking:** when no single note answers a question, DoonDesk searches every topic, pieces together what it can, shows its steps, and says plainly when it doesn't know

Each answer shows where its information came from and suggests follow-up questions.

## How answers work

- **School notes (always on):** DoonDesk matches your question against its knowledge base and answers instantly. It works offline and anywhere.
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
- Doon School Guide (Google Doc): houses, campus, sport, pastoral care and school life
- [School website: Leadership](https://www.doonschool.com/about-us/leadership/): the 2026–27 student leadership boards
- [Wikipedia: The Doon School](https://en.wikipedia.org/wiki/The_Doon_School), for a few gaps
