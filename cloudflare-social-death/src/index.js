import { POSTER_GOTHIC_DATA_URI } from "./poster-gothic-data.js";

const ALLOWED_USERS = new Set([
  "fotaibi@gmail.com",
  "abusanadot@gmail.com",
  "tlughod@amedianet.com",
]);

const SECURITY_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const UNAUTHORIZED_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Access not recognized</title>
  <style>
    @font-face {
      font-family: "PosterGothic";
      src: url("${POSTER_GOTHIC_DATA_URI}") format("opentype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    :root {
      color-scheme: dark;
      --ink: #f3eee6;
      --muted: #a59f96;
      --orange: #ef7b32;
      --black: #080909;
      --steel: #121414;
      --line: #292b2a;
    }

    * { box-sizing: border-box; }

    html, body { min-height: 100%; }

    body {
      margin: 0;
      min-height: 100svh;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: var(--black);
      color: var(--ink);
      font-family: system-ui, sans-serif;
      text-rendering: optimizeLegibility;
    }

    body::before,
    body::after {
      content: "";
      position: fixed;
      inset-block: 0;
      width: calc(50% - 1px);
      z-index: 0;
      background: var(--steel);
      border-color: var(--line);
      transition: transform 900ms cubic-bezier(.16, 1, .3, 1);
    }

    body::before {
      inset-inline-start: 0;
      border-inline-end: 1px solid var(--line);
      box-shadow: inset -30px 0 70px rgba(0, 0, 0, .4);
    }

    body::after {
      inset-inline-end: 0;
      border-inline-start: 1px solid var(--line);
      box-shadow: inset 30px 0 70px rgba(0, 0, 0, .4);
    }

    main {
      position: relative;
      z-index: 1;
      width: min(88vw, 760px);
      padding: 48px 24px;
      text-align: center;
    }

    .indicator {
      width: 66px;
      height: 38px;
      margin: 0 auto 48px;
      display: grid;
      place-items: center;
      border: 1px solid #393b39;
      background: #0b0c0c;
      box-shadow: 0 16px 36px rgba(0, 0, 0, .38);
      color: var(--orange);
      font: 400 20px/1 "PosterGothic", sans-serif;
    }

    h1 {
      max-width: 11ch;
      margin: 0 auto;
      font: 400 clamp(3rem, 8vw, 6rem)/.94 "PosterGothic", sans-serif;
      letter-spacing: -.025em;
      text-wrap: balance;
    }

    p {
      margin: 28px auto 0;
      color: var(--muted);
      font-family: "PosterGothic", sans-serif;
      font-size: clamp(.95rem, 2vw, 1.08rem);
      line-height: 1.6;
      letter-spacing: .02em;
    }

    a {
      display: inline-flex;
      align-items: center;
      min-height: 46px;
      margin-top: 40px;
      padding: 0 22px;
      border: 1px solid var(--orange);
      color: var(--ink);
      text-decoration: none;
      font-size: .92rem;
      font-weight: 600;
      letter-spacing: .02em;
      transition: color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
    }

    a:hover {
      background: var(--orange);
      color: #160c06;
      box-shadow: 0 12px 32px rgba(239, 123, 50, .2);
    }

    a:focus-visible {
      outline: 3px solid var(--ink);
      outline-offset: 5px;
    }

    ::selection { background: var(--orange); color: #160c06; }

    @media (max-width: 520px) {
      main { padding-inline: 20px; }
      .indicator { margin-bottom: 38px; }
      h1 { font-size: clamp(3.4rem, 17vw, 5rem); }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition-duration: .01ms !important; }
    }
  </style>
</head>
<body>
  <main>
    <div class="indicator" aria-hidden="true">—</div>
    <h1>No one is expecting you.</h1>
    <p>Access has not been recognized.</p>
    <a href="/">Try again</a>
  </main>
</body>
</html>`;

function deny() {
  return new Response(UNAUTHORIZED_PAGE, {
    status: 401,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/html; charset=UTF-8",
      "WWW-Authenticate": 'Basic realm="Social Death", charset="UTF-8"',
    },
  });
}

function readCredentials(request) {
  const header = request.headers.get("Authorization");
  if (!header || !header.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator).trim().toLowerCase(),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

async function digest(value) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function passwordsMatch(received, expected) {
  const [left, right] = await Promise.all([digest(received), digest(expected)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export default {
  async fetch(request, env) {
    const credentials = readCredentials(request);
    if (
      !credentials ||
      !ALLOWED_USERS.has(credentials.username) ||
      !(await passwordsMatch(credentials.password, env.DASHBOARD_PASSWORD))
    ) {
      return deny();
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value);
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
