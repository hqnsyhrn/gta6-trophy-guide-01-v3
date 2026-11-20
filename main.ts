import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const TEXT_MAX_BYTES = 163840;

function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return "/output";
}

function removeIfPresent(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

function copyEntry(src: string, dest: string): void {
  cpSync(src, dest, { recursive: true });
}

function main(): void {
  const root = repoRoot();
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  removeIfPresent(join(out, "app"));
  removeIfPresent(join(out, "screenshots"));
  removeIfPresent(join(out, "dossier.json"));
  copyEntry(join(root, "app"), join(out, "app"));
  copyEntry(join(root, "screenshots"), join(out, "screenshots"));
  const dossier = buildDossier(out, { text_max_bytes: TEXT_MAX_BYTES });
  writeFileSync(join(out, "dossier.json"), dossier);
  console.log("Wrote dossier.json (" + dossier.length + " bytes) to " + out);
}

main();
