import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "../../cloudflare-social-death/node_modules/playwright/index.js";

const server = spawn("python3", ["-m", "http.server", "4173", "--directory", "."], {
  stdio: "ignore",
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

try {
  await wait(750);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("http://127.0.0.1:4173/Social_Death/", {
    waitUntil: "networkidle",
  });
  if (!response?.ok()) throw new Error(`dashboard returned HTTP ${response?.status()}`);
  await page.waitForSelector("body");

  const media = await page.locator("img, video").evaluateAll((elements) =>
    elements.map((element) => ({
      tag: element.tagName,
      source: element.currentSrc || element.src || "",
      readyState: element.readyState ?? null,
      naturalWidth: element.naturalWidth ?? null,
    })),
  );
  if (media.length === 0) throw new Error("dashboard rendered no image or video elements");

  const broken = media.filter((item) =>
    item.tag === "IMG" ? item.naturalWidth === 0 : item.readyState === 0,
  );
  if (broken.length) throw new Error(`${broken.length} rendered media element(s) failed to load`);
  if (errors.length) throw new Error(`browser errors: ${errors.join(" | ")}`);

  console.log(`Browser check passed with ${media.length} rendered media elements`);
  await browser.close();
} finally {
  server.kill("SIGTERM");
}

