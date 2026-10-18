# Turning on Gemini AI for DoonDesk

DoonDesk can use Google's **Gemini** AI to answer questions in its own words, using all of DoonDesk's school notes. When Gemini is busy or its free limit runs out, DoonDesk falls back to its built-in answers automatically.

> **Keep your API key secret.** Never paste it into `index.html`, this repo, or anywhere public. Anyone who sees it could use up your free allowance, and Google may switch off keys it finds on GitHub.

There are two ways to connect it.

## Option 1: Just on your own device (2 minutes)

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (sign in, then **Create API key**).
2. Open DoonDesk, tap **✦ Connect AI** under the ask box, paste the key and tap **Save and test**.

The key stays in that browser only. Other visitors still get the built-in answers.

## Option 2: For every visitor (about 10 minutes, free)

This uses a free **Cloudflare Worker**: a tiny program that sits between DoonDesk and Google and keeps your key hidden.

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

- **Model fallback:** DoonDesk tries Gemini's free models in turn (Gemini Flash, 3 Flash, 2.5 Flash, 3.1 Flash-Lite, Flash-Lite, 2.5 Flash-Lite). Each model has its own free limit, so when one runs out it moves to the next, and remembers to rest the used-up one until its limit resets. Only when all of them are used up does it fall back to the built-in answers.
- The Worker only accepts requests from the DoonDesk website, and only for Gemini's free Flash and Flash-Lite models. If you set the Worker up before this change, paste in the new `worker.js` again so it allows the newer models.
- Gemini's free tier has limits on requests per minute and per day. If they're reached, DoonDesk quietly uses its built-in answers until they reset.
- Cloudflare's free plan allows about 100,000 Worker requests a day, far more than DoonDesk needs.
- To switch the AI off, delete the `GEMINI_KEY` secret or the Worker.
