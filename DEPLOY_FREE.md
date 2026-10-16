# Free hosting setup (Cloudflare Pages + Render + MongoDB Atlas)

This setup keeps the frontend on Cloudflare Pages, runs the API on Render's free web service, and uses MongoDB Atlas for persistent storage. It does not use your laptop as a server.

> **Important:** Free hosting providers can change their limits and availability. Render's free web service may sleep when idle, so the first request after inactivity can be slow. This is not a guaranteed always-awake server.

## 1. Prepare the secrets

You need:
- A MongoDB Atlas connection string for your cluster, including the database name `your_spotify`.
- A Spotify Developer app's client ID and client secret.
- A public HTTPS URL for the API and a public HTTPS URL for the Pages frontend.

Never commit the MongoDB connection string or Spotify client secret to this repository. Add them only in the hosting provider's environment-variable settings.

In MongoDB Atlas, make sure the database user has the permissions Your Spotify needs and that the cluster's network access rules allow the Render service to connect. Avoid publishing credentials in screenshots or chat.

## 2. Deploy the API to Render

1. Sign in to Render and create a **Blueprint** from this repository.
2. Select the `deploy/free-hosting-setup` branch while testing this setup.
3. Render should detect `render.yaml` and offer the `your-spotify-api` web service.
4. Set the requested environment variables:
   - `MONGO_ENDPOINT`: your Atlas connection string. Use the `mongodb+srv://...` URI and include `/your_spotify` as the database path if your Atlas URI doesn't already specify a database.
   - `SPOTIFY_PUBLIC`: your Spotify app's client ID.
   - `SPOTIFY_SECRET`: your Spotify app's client secret.
   - `API_ENDPOINT`: the API's public HTTPS URL, for example `https://your-spotify-api.onrender.com`. Use the actual URL Render assigns to the service.
   - `CLIENT_ENDPOINT`: the Pages URL from step 3. You can set a temporary value now and update it after the frontend is deployed.
5. Deploy the service and wait for the build to finish.

If Render assigns a different URL, use that exact URL everywhere below. The free service may sleep after inactivity.

## 3. Deploy the frontend to Cloudflare Pages

1. In Cloudflare, open **Workers & Pages** and create a Pages project connected to this GitHub repository.
2. Choose the `deploy/free-hosting-setup` branch while testing.
3. Use these build settings:
   - **Root directory:** repository root (leave blank)
   - **Build command:** `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @your_spotify/client build && node scripts/deploy/cloudflare-client.mjs`
   - **Build output directory:** `apps/client/build`
4. Add the build environment variable `API_ENDPOINT` with the exact public HTTPS URL of your Render API.
5. Deploy. Cloudflare should provide a URL ending in `.pages.dev`.

The build script writes the public API URL into the generated frontend and updates the page's Content Security Policy. The API URL is public configuration; do not put the Spotify client secret or MongoDB credentials in Cloudflare Pages.

## 4. Connect the two services

1. Return to Render and update `CLIENT_ENDPOINT` to the exact `.pages.dev` URL.
2. In the Spotify Developer Dashboard, add this **Redirect URI**:
   `https://YOUR-API-HOST/oauth/spotify/callback`
   Replace `YOUR-API-HOST` with the hostname Render actually assigned. The redirect URI belongs to the **backend**, not the Pages frontend.
3. Save the Spotify app settings and redeploy/restart the Render service if required.
4. Open the Pages URL and test Spotify login. If login fails, check Render logs and confirm the API URL, client URL, redirect URI, Atlas access rules, and secrets match exactly.

## 5. If the Blueprint doesn't deploy

You can create a Render **Web Service** manually from this repository, choose the Docker runtime, and set the Dockerfile path to `Dockerfile.server.production`. Add the same environment variables listed above.

This is a deployment configuration, not a guarantee that the live app has deployed successfully. Confirm the build and test login before relying on it.
