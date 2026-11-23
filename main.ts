// Entry program for the "Day one, day seven" TikTok bounty.
//
// Its only job is to hand the video's address to the grader: it reads
// VIDEO.json from the repository root and writes an identical copy into
// the output directory make.fun provides. It does no network, keeps no
// clock, and writes the same bytes on every run.
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = process.env.MAKEFUN_BOT_DIR ?? ".";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";

const sourcePath = join(repoRoot, "VIDEO.json");
const targetPath = join(outDir, "VIDEO.json");

// Parse first so a malformed VIDEO.json fails loudly instead of
// silently copying a broken file through to the grader.
const text = await readFile(sourcePath, "utf8");
const parsed: unknown = JSON.parse(text);
if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  throw new Error("VIDEO.json must hold a JSON object");
}
if (typeof (parsed as { url?: unknown }).url !== "string") {
  throw new Error("VIDEO.json must hold a url string");
}
const videoUrl = (parsed as { url: string }).url;
if (!videoUrl.startsWith("https://")) {
  throw new Error("VIDEO.json url must be an https address");
}

await mkdir(outDir, { recursive: true });
await copyFile(sourcePath, targetPath);

// Confirm the copy landed byte-for-byte: the grader runs this
// program twice and the two runs must write the same bytes.
const copied = await readFile(targetPath, "utf8");
if (copied !== text) {
  throw new Error("VIDEO.json copy does not match the source");
}
