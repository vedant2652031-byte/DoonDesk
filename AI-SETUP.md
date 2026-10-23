# Turning on Gemini AI for DoonDesk

DoonDesk can use Google's **Gemini** AI to answer questions in its own words, using all of DoonDesk's school notes. When Gemini is busy or its free limit runs out, DoonDesk falls back to its built-in answers automatically.

> **Keep your API key secret.** Never paste it into `index.html`, this repo, or anywhere public. Anyone who sees it could use up your free allowance, and Google may switch off keys it finds on GitHub.

There are two ways to connect it.

## Option 1: Just on your own device (2 minutes)

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (sign in, then **Create API key**).
2. Open DoonDesk, tap **✦ Connect AI** under the ask box, paste the key and tap **Save and test**.

The key stays in that browser only. Other visitors still get the built-in answers.

## Option 2: For every visitor, on Vercel (5 minutes, free) ← recommended

DoonDesk's Vercel site includes a small server function, [`api/gemini.mjs`](api/gemini.mjs), that adds your key on the server. Visitors never see the key, and nobody has to type anything.

1. Go to [vercel.com](https://vercel.com) and open the **doondesk** project.
2. Open **Settings** → **Environment Variables**.
3. Add a variable:
   - **Key:** `GEMINI_KEY`
   - **Value:** your Gemini API key
   - **Environments:** Production (you can tick all three)
   - Click **Save**.
4. Open **Deployments**, click **⋯** on the top deployment and choose **Redeploy**. The key only takes effect after a redeploy.

That's it. The ✦ button now shows **Gemini on** for everyone, on both doondesk.vercel.app and the GitHub Pages site. To switch it off, delete the variable and redeploy.

### How it saves the free allowance

Google's free limits are **per project**, shared by every visitor, so the shared connection is careful with them:

- Questions DoonDesk's notes already answer get the instant built-in answer. Gemini is only asked when the notes don't cover a question.
- Each device can ask Gemini up to **15** questions a day on the shared connection; after that it uses the built-in answers.
- When a model's limit runs out, DoonDesk moves to the next free model, then to the built-in answers. Daily limits reset at midnight Pacific time (about 1:30 pm in India).
- The function only accepts requests from the DoonDesk websites, only for the free Gemini Flash, Flash-Lite and Gemma models, and caps the length of answers.

For a big event, check your limits at [aistudio.google.com/rate-limit](https://aistudio.google.com/rate-limit). Turning on billing for the Google project raises the limits a lot.

## Option 3: Cloudflare Worker (older alternative)

This does the same job on Cloudflare instead of Vercel.

1. **Create a Cloudflare account** at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) (free plan).
2. In the dashboard, open **Workers & Pages** → **Create** → **Create Worker**. Name it `doondesk-ai` and click **Deploy**.
3. Click **Edit code**. Delete everything in the editor, paste in the whole of [`ai-worker/worker.js`](ai-worker/worker.js) from this repo, and click **Deploy**.
4. Go back to the Worker, open **Settings** → **Variables and Secrets** → **Add**.
   - Type: **Secret**
   - Name: `GEMINI_KEY`
   - Value: your Gemini API key
   - Click **Deploy** (or **Save**).
5. Copy the Worker's address from its overview page. It looks like `https://doondesk-ai.your-name.workers.dev`.
6. Give that address to whoever maintains DoonDesk (the address is fine to share; the key is not). It goes into one line near the top of DoonDesk's AI code:
   `const GEMINI_PROXY='https://doondesk-ai.your-name.workers.dev';`

Once that's live, the ✦ button shows **Gemini on** for everyone.

### Good to know

- **Model fallback:** DoonDesk tries 11 free models in turn: Gemini 3.8 Flash, 3.6 Flash, Flash (latest), 3 Flash, 2.5 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, Flash-Lite (latest), 2.5 Flash-Lite, then Google's open Gemma 4 models (31B and 26B). Each model has its own free limit, so when one runs out it moves to the next, and remembers to rest the used-up one until its limit resets. Only when all of them are used up does it fall back to the built-in answers.
- The Worker only accepts requests from the DoonDesk website, and only for Gemini's free Flash, Flash-Lite and Gemma models. If you set the Worker up before this change, paste in the new `worker.js` again so it allows the newer models.
- Gemini's free tier has limits on requests per minute and per day. If they're reached, DoonDesk quietly uses its built-in answers until they reset.
- Cloudflare's free plan allows about 100,000 Worker requests a day, far more than DoonDesk needs.
- To switch the AI off, delete the `GEMINI_KEY` secret or the Worker.

## Question log and review page (5 minutes, free)

DoonDesk can save every question visitors ask, what it answered, and (when it didn't know) the note it would have used, so you can fix gaps later. Visitors can also tap **“Wrong or missing answer? Tell us”** under an answer to flag it. Nothing that identifies a visitor is saved: no IP address, account or device ID. While the log is on, the site says “Questions are saved anonymously to help improve DoonDesk.”

1. In Vercel, open the **doondesk** project → **Storage** → **Create Database** → **Upstash for Redis** (free plan) → **Connect** it to the doondesk project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
2. Open **Settings** → **Environment Variables** → add **`ADMIN_KEY`** with a password only you know.
3. **Deployments** → **⋯** → **Redeploy**.
4. Open **doondesk.vercel.app/review.html** and enter that password.

The review page shows **Needs fixing** first: questions DoonDesk didn't know, only partly answered, answered from outside its notes, or that visitors flagged. Each shows what DoonDesk said and its closest guess. Tick **Fixed** as you go, and use **Download (CSV)** to get a spreadsheet you can send for the next update. The log keeps the latest 5,000 questions.
