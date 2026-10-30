import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";

const dashboardPath = "Social_Death/index.html";
const routedDashboardPath = "Social_Death/dashboard/index.html";
const releasePath = "Social_Death/dashboard/release.json";
const mediaPath = "Social_Death/dashboard/release.media.json";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(message) {
  console.error(`Release verification failed: ${message}`);
  process.exit(1);
}

const [dashboard, routedDashboard, releaseText, mediaText] = await Promise.all([
  readFile(dashboardPath),
  readFile(routedDashboardPath),
  readFile(releasePath, "utf8"),
  readFile(mediaPath, "utf8"),
]);

if (!dashboard.equals(routedDashboard)) {
  fail(`${dashboardPath} and ${routedDashboardPath} are not byte-identical`);
}

const release = JSON.parse(releaseText);
const media = JSON.parse(mediaText);
const actualHash = sha256(dashboard);
const requestedHash = process.env.EXPECTED_SHA256?.trim();

if (!/^v\d{3}$/.test(release.version)) fail("release.json has an invalid version");
if (release.sha256 !== actualHash) fail("release.json SHA-256 does not match the dashboard");
if (requestedHash && requestedHash !== actualHash) fail("workflow input SHA-256 does not match the dashboard");
if (media.release_sha256 !== actualHash) fail("media manifest SHA-256 does not match the dashboard");
if (!dashboard.includes(release.version)) fail("dashboard does not contain its declared version");

const sourceRecords = media.source_records ?? [];
const packagedMedia = media.media ?? [];
if (sourceRecords.length === 0 || packagedMedia.length === 0) {
  fail("media manifest contains no source or packaged-media records");
}
if (media.audit?.structural !== true) fail("media manifest structural audit is incomplete");

for (const record of packagedMedia) {
  if (!record.display_sha256 || !record.source_sha256 || !record.kind || !record.status) {
    fail("a media record is missing hashes, kind, or status");
  }
}

console.log(`Verified ${release.version} (${actualHash})`);
console.log(`Verified ${packagedMedia.length} packaged media records from ${sourceRecords.length} sources`);

