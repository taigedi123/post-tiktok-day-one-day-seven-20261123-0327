// Entry program for the "Day one, day seven" TikTok bounty.
//
// The video itself is the entry; this program's whole job is to hand
// its address to the grader. It reads VIDEO.json from the repository
// root, checks that the address inside is a real TikTok video address
// (not the starter's placeholder), and writes the file, unchanged,
// into the output directory. No network, no clock, no state: two runs
// write the same bytes.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// A posted TikTok video address looks like
// https://www.tiktok.com/@somehandle/video/1234567890123456789 —
// a handle after the @, then /video/ and the numeric video id.
const TIKTOK_VIDEO = /^https:\/\/www\.tiktok\.com\/@[\w.]+\/video\/(\d+)$/;

const sourcePath = join(botDir, "VIDEO.json");
const raw = await readFile(sourcePath, "utf8");

let data: unknown;
try {
  data = JSON.parse(raw);
} catch {
  throw new Error("VIDEO.json is not valid JSON");
}
if (typeof data !== "object" || data === null || Array.isArray(data)) {
  throw new Error("VIDEO.json must be a JSON object");
}
const url = (data as { url?: unknown }).url;
if (typeof url !== "string") {
  throw new Error("VIDEO.json must carry a url string");
}

const match = TIKTOK_VIDEO.exec(url);
if (match === null) {
  throw new Error(`VIDEO.json url is not a TikTok video address: ${url}`);
}
if (/^0+$/.test(match[1])) {
  throw new Error("VIDEO.json still holds the placeholder video id");
}

await mkdir(outputDir, { recursive: true });
const targetPath = join(outputDir, "VIDEO.json");
await writeFile(targetPath, raw, "utf8");

// Read the copy back and compare it byte for byte with the source:
// the grader runs this program twice and both runs must agree.
const copied = await readFile(targetPath, "utf8");
if (copied !== raw) {
  throw new Error("the VIDEO.json copy differs from the source");
}

// One more guard: the copy must still parse to the same address, so
// a truncated or mangled write can never slip through quietly.
const reparsed = JSON.parse(copied) as { url?: unknown };
if (reparsed.url !== url) {
  throw new Error("the VIDEO.json copy parses to a different url");
}

console.log(`VIDEO.json handed over for TikTok video ${match[1]}`);
