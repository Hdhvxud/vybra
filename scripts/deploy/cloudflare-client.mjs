import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const apiEndpoint = process.env.API_ENDPOINT;

if (!apiEndpoint) {
  throw new Error(
    "API_ENDPOINT is required. Set it to the public HTTPS URL of the Your Spotify backend in Cloudflare Pages build settings.",
  );
}

let apiUrl;
try {
  apiUrl = new URL(apiEndpoint);
} catch {
  throw new Error("API_ENDPOINT must be a valid absolute URL.");
}

if (apiUrl.protocol !== "https:") {
  throw new Error("API_ENDPOINT must use HTTPS for a public deployment.");
}
if (apiUrl.username || apiUrl.password) {
  throw new Error("API_ENDPOINT must not contain credentials.");
}

const buildDir = join(process.cwd(), "apps", "client", "build");
const variablesPath = join(buildDir, "variables.js");
const htmlPath = join(buildDir, "index.html");
const normalizedApiEndpoint = apiUrl.toString().replace(/\/$/, "");

await writeFile(
  variablesPath,
  `window.API_ENDPOINT = ${JSON.stringify(normalizedApiEndpoint)};\n`,
  "utf8",
);

let html = await readFile(htmlPath, "utf8");
const connectSrc = `connect-src 'self' ${normalizedApiEndpoint}/;`;
html = html.replace(/connect-src[^;]*;/, connectSrc);
html = html.replace(
  /(<meta property="og:image" content=")[^"]*(")/,
  `$1${normalizedApiEndpoint}/static/your_spotify_1200.png$2`,
);
html = html.replace(
  /(<meta property="twitter:image" content=")[^"]*(")/,
  `$1${normalizedApiEndpoint}/static/your_spotify_1200.png$2`,
);
await writeFile(htmlPath, html, "utf8");

console.log(`Configured Cloudflare Pages frontend to use ${normalizedApiEndpoint}`);
