#!/usr/bin/env node

/**
 * @fileoverview Package age quarantine check.
 *
 * Verifies that no direct production dependency was published less than
 * N days ago. Prevents installing potentially compromised packages before
 * the community has time to review them (supply chain protection).
 *
 * Trusted scopes (major framework publishers) emit warnings, not failures.
 *
 * Usage: node scripts/check-package-age.mjs [--days=14]
 * Exit code 1 if any untrusted package is too young.
 */

import { readFileSync } from "fs";

const MIN_AGE_DAYS = parseInt(
  process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] || "14",
  10
);
const NOW = Date.now();
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

// Trusted scopes — major publishers where supply chain risk is minimal.
// These still get warnings but don't block the build.
const TRUSTED_SCOPES = new Set([
  "@next", "@prisma", "@types", "@tailwindcss",
  "@tiptap", "@vitejs", "@vitest", "@typescript-eslint",
  "@base-ui", "@testing-library",
]);
const TRUSTED_PACKAGES = new Set([
  "react", "react-dom", "next", "next-auth", "prisma",
  "typescript", "eslint", "vitest", "tailwindcss",
  "nodemailer", "dotenv", "zod", "sharp", "dompurify",
  "sanitize-html", "clsx", "lucide-react", "recharts",
]);

function isTrusted(name) {
  if (TRUSTED_PACKAGES.has(name)) return true;
  const scope = name.startsWith("@") ? name.split("/")[0] : null;
  return scope ? TRUSTED_SCOPES.has(scope) : false;
}

// Read package.json to get direct production deps
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const directDeps = new Set(Object.keys(pkg.dependencies || {}));

// Read lockfile for resolved versions
const lockfile = JSON.parse(readFileSync("package-lock.json", "utf-8"));
const packages = lockfile.packages || {};

// Collect direct production deps only
const deps = Object.entries(packages)
  .filter(([key]) => {
    if (!key.startsWith("node_modules/")) return false;
    // Skip nested (transitive) deps
    const name = key.replace("node_modules/", "");
    if (name.includes("node_modules/")) return false;
    return directDeps.has(name);
  })
  .map(([key, val]) => ({
    name: key.replace("node_modules/", ""),
    version: val.version,
    resolved: val.resolved,
  }))
  .filter((d) => d.resolved?.includes("registry.npmjs.org"));

console.log(
  `Checking ${deps.length} direct production deps for minimum age of ${MIN_AGE_DAYS} days...\n`
);

const tooYoung = [];
const warnings = [];
let checked = 0;
let errors = 0;

const CONCURRENCY = 10;

async function checkPackage(dep) {
  try {
    // Fetch full package metadata to get publish times
    const res = await fetch(`https://registry.npmjs.org/${dep.name}`, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) { errors++; return; }
    const data = await res.json();
    const publishTime = data.time?.[dep.version];
    if (!publishTime) { errors++; return; }

    const publishDate = new Date(publishTime);
    const ageMs = NOW - publishDate.getTime();
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

    checked++;
    if (ageMs < MIN_AGE_MS) {
      const entry = {
        name: dep.name,
        version: dep.version,
        published: publishDate.toISOString().slice(0, 10),
        ageDays,
        trusted: isTrusted(dep.name),
      };
      if (entry.trusted) {
        warnings.push(entry);
      } else {
        tooYoung.push(entry);
      }
    }
  } catch {
    errors++;
  }
}

for (let i = 0; i < deps.length; i += CONCURRENCY) {
  const batch = deps.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(checkPackage));
  process.stdout.write(
    `\r  Checked ${Math.min(i + CONCURRENCY, deps.length)}/${deps.length}`
  );
}
console.log("\n");

// Report warnings (trusted packages — informational only)
if (warnings.length > 0) {
  console.log(
    `\x1b[33m WARN \x1b[0m ${warnings.length} trusted package(s) younger than ${MIN_AGE_DAYS} days (informational):\n`
  );
  for (const pkg of warnings) {
    console.log(
      `  - ${pkg.name}@${pkg.version} (published ${pkg.published}, ${pkg.ageDays}d ago)`
    );
  }
  console.log();
}

// Report failures (untrusted packages — blocks build)
if (tooYoung.length > 0) {
  console.log(
    `\x1b[31m FAIL \x1b[0m ${tooYoung.length} untrusted package(s) younger than ${MIN_AGE_DAYS} days:\n`
  );
  for (const pkg of tooYoung) {
    console.log(
      `  - ${pkg.name}@${pkg.version} (published ${pkg.published}, ${pkg.ageDays}d ago)`
    );
  }
  console.log(
    `\nThese packages haven't passed the ${MIN_AGE_DAYS}-day quarantine period.`
  );
  console.log(
    "Wait for the quarantine period, pin to an older version, or add to trusted list.\n"
  );
  process.exit(1);
}

console.log(
  `\x1b[32m PASS \x1b[0m All ${checked} direct production deps pass quarantine check.`
);
if (errors > 0) {
  console.log(
    `  (${errors} packages could not be checked — missing registry metadata)`
  );
}
process.exit(0);
