#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const WEBSITE_DIR = process.env.Q9_WEBSITE_DIR ? resolveHome(process.env.Q9_WEBSITE_DIR) : join(REPO_ROOT, "website");
let eventPath = "leap";
const WEBSITE_EXPORT_DIR = join(WEBSITE_DIR, "build");
const CAPSULE_DIR = join(REPO_ROOT, "leap/leads-capsule");
const DEPLOY_ID = "dep_bjl_mBFAHazNWWeS";
const LEAD_ENDPOINT = "https://q9-leap-leads.lakebed.app/api/leads";
const SITE_ORIGIN = "https://q9labs.ai";

const HOSTINGER = {
  host: process.env.Q9_HOSTINGER_HOST || "45.145.185.225",
  port: process.env.Q9_HOSTINGER_PORT || "65002",
  user: process.env.Q9_HOSTINGER_USER || "u469870673",
  key: resolveHome(process.env.Q9_HOSTINGER_KEY || "~/.ssh/hostinger_websites_ed25519"),
  root: process.env.Q9_HOSTINGER_ROOT || "domains/q9labs.ai"
};

function resolveHome(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return resolve(path);
}

function shellQuote(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function usage() {
  return `Usage: ./leap/deploy [--test-email ADDRESS] [--dry-run] [--rollback]

Builds the static website, deploys the Lakebed lead capsule, stages and swaps
the Hostinger release, then runs production smoke checks.

  --test-email ADDRESS  Submit one real production lead and email ADDRESS.
  --dry-run             Build and verify access without changing production.
  --rollback            Restore the previous Hostinger website release.
  --help                Show this help.`;
}

function parseArguments(argv) {
  const options = { dryRun: false, rollback: false, testEmail: undefined };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--rollback") {
      options.rollback = true;
      continue;
    }
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument === "--test-email") {
      const address = argv[index + 1];
      if (!address || address.startsWith("--")) {
        throw new Error("--test-email requires an email address");
      }
      options.testEmail = address;
      index += 1;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    }
    throw new Error(`unknown argument: ${argument}`);
  }

  if (options.rollback && (options.dryRun || options.testEmail)) {
    throw new Error("--rollback cannot be combined with --dry-run or --test-email");
  }
  if (options.testEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(options.testEmail)) {
    throw new Error(`invalid test email address: ${options.testEmail}`);
  }

  return options;
}

function commandLabel(command, args) {
  return [command, ...args].join(" ");
}

async function run(command, args, options = {}) {
  console.log(`\n$ ${commandLabel(command, args)}`);
  await new Promise((resolvePromise, reject) => {
    let timedOut = false;
    const child = spawn(command, args, {
      cwd: options.cwd || REPO_ROOT,
      env: process.env,
      stdio: "inherit"
    });
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeoutMs || 15 * 60 * 1000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`could not start ${command}: ${error.message}`));
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(new Error(`${commandLabel(command, args)} timed out`));
        return;
      }
      if (code === 0) {
        resolvePromise();
        return;
      }
      const outcome = signal ? `signal ${signal}` : `exit ${code}`;
      reject(new Error(`${commandLabel(command, args)} failed with ${outcome}`));
    });
  });
}

function sshArguments(remoteCommand) {
  return [
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=15",
    "-o", "StrictHostKeyChecking=yes",
    "-i", HOSTINGER.key,
    "-p", HOSTINGER.port,
    `${HOSTINGER.user}@${HOSTINGER.host}`,
    remoteCommand
  ];
}

async function ssh(remoteCommand) {
  await run("ssh", sshArguments(remoteCommand));
}

function rsyncShell() {
  return [
    "ssh",
    "-o BatchMode=yes",
    "-o ConnectTimeout=15",
    "-o StrictHostKeyChecking=yes",
    `-i ${shellQuote(HOSTINGER.key)}`,
    `-p ${HOSTINGER.port}`
  ].join(" ");
}

async function assertFile(path, label) {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`${label} is missing or unreadable: ${path}`);
  }
}

async function preflight() {
  if (!/^[A-Za-z0-9.-]+$/.test(HOSTINGER.host)) throw new Error("Q9_HOSTINGER_HOST contains invalid characters");
  if (!/^\d+$/.test(HOSTINGER.port)) throw new Error("Q9_HOSTINGER_PORT must be numeric");
  if (!/^[A-Za-z0-9_-]+$/.test(HOSTINGER.user)) throw new Error("Q9_HOSTINGER_USER contains invalid characters");
  if (!/^[A-Za-z0-9._/-]+$/.test(HOSTINGER.root)) throw new Error("Q9_HOSTINGER_ROOT contains invalid characters");
  await assertFile(HOSTINGER.key, "Hostinger SSH key");
  await assertFile(join(CAPSULE_DIR, ".env.lakebed.server"), "Lakebed server environment");
  await Promise.all([
    run("pnpm", ["--version"]),
    run("npx", ["lakebed", "help"], { cwd: CAPSULE_DIR }),
    run("rsync", ["--version"]),
    ssh(`test -d '${HOSTINGER.root}/public_html' && test -x /usr/bin/rsync`)
  ]);
}

function makeReleaseId() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${timestamp}-${randomBytes(3).toString("hex")}`;
}

async function writeReleaseMarker(releaseId) {
  const markerDirectory = join(WEBSITE_EXPORT_DIR, ".well-known");
  await mkdir(markerDirectory, { recursive: true });
  await writeFile(
    join(markerDirectory, "q9-deploy.json"),
    `${JSON.stringify({ releaseId, deployedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8"
  );
}

async function buildWebsite(releaseId) {
  await run("pnpm", ["build"], { cwd: WEBSITE_DIR });
  await Promise.all([
    assertFile(join(WEBSITE_EXPORT_DIR, "index.html"), "static export home page"),
    Promise.any(["aie.html", "aie/index.html", "leap.html"].map((path) =>
      assertFile(join(WEBSITE_EXPORT_DIR, path), "static export event page")
    ))
  ]);
  try {
    await Promise.any(["aie.html", "aie/index.html"].map((path) =>
      assertFile(join(WEBSITE_EXPORT_DIR, path), "static export AIE page")
    ));
    eventPath = "aie";
  } catch {
    eventPath = "leap";
  }
  await writeReleaseMarker(releaseId);
}

async function deployCapsule() {
  await run("npx", ["lakebed", "deploy"], { cwd: CAPSULE_DIR });
  await run("npx", ["lakebed", "inspect", DEPLOY_ID], { cwd: CAPSULE_DIR });
}

async function stageWebsite(releaseId, dryRun) {
  const remoteStage = dryRun
    ? `${HOSTINGER.root}/public_html`
    : `${HOSTINGER.root}/.deploy-${releaseId}`;
  if (!dryRun) await ssh(`rm -rf '${remoteStage}' && mkdir -p '${remoteStage}'`);

  const args = [
    "--archive",
    "--compress",
    "--delete",
    "--delay-updates",
    "--human-readable",
    "--itemize-changes",
    "--rsh", rsyncShell()
  ];
  if (dryRun) args.push("--dry-run");
  args.push(`${WEBSITE_EXPORT_DIR}/`, `${HOSTINGER.user}@${HOSTINGER.host}:${remoteStage}/`);

  try {
    await run("rsync", args);
    if (!dryRun) {
      await ssh(`chmod -R u=rwX,go=rX '${remoteStage}' && test -s '${remoteStage}/index.html' && ( test -s '${remoteStage}/leap.html' || test -s '${remoteStage}/aie.html' || test -s '${remoteStage}/aie/index.html' ) && test -s '${remoteStage}/.well-known/q9-deploy.json'`);
    }
  } catch (error) {
    if (!dryRun) await ssh(`rm -rf '${remoteStage}'`);
    throw error;
  }

  return remoteStage;
}

async function activateWebsite(remoteStage) {
  const live = `${HOSTINGER.root}/public_html`;
  const previous = `${HOSTINGER.root}/.deploy-previous`;
  const command = [
    "set -eu",
    `rm -rf '${previous}'`,
    `mv '${live}' '${previous}'`,
    `if mv '${remoteStage}' '${live}'; then exit 0; fi`,
    `mv '${previous}' '${live}'`,
    "exit 1"
  ].join("; ");
  await ssh(command);
}

async function rollbackWebsite(releaseId) {
  const live = `${HOSTINGER.root}/public_html`;
  const previous = `${HOSTINGER.root}/.deploy-previous`;
  const failed = `${HOSTINGER.root}/.deploy-failed-${releaseId}`;
  const command = [
    "set -eu",
    `test -d '${previous}'`,
    `mv '${live}' '${failed}'`,
    `mv '${previous}' '${live}'`,
    `rm -rf '${failed}'`
  ].join("; ");
  await ssh(command);
}

async function readResponse(url, options, expectedStatus) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${url} returned ${response.status}; expected ${expectedStatus}: ${body.slice(0, 300)}`);
  }
  return { response, body };
}

async function smokeTest(releaseId) {
  const marker = await readResponse(
    `${SITE_ORIGIN}/.well-known/q9-deploy.json?release=${encodeURIComponent(releaseId)}`,
    { headers: { "cache-control": "no-cache" } },
    200
  );
  const parsedMarker = JSON.parse(marker.body);
  if (parsedMarker.releaseId !== releaseId) {
    throw new Error(`live release marker is ${parsedMarker.releaseId}; expected ${releaseId}`);
  }

  const event = await readResponse(`${SITE_ORIGIN}/${eventPath}?release=${encodeURIComponent(releaseId)}`, {}, 200);
  if (eventPath === "aie"
    ? !event.body.includes("AI Everything") || !event.body.includes("3 months") || !event.body.includes("free")
    : !event.body.includes("Free for 3 months.") || !event.body.includes("31 Aug") || !event.body.includes("3 Sep 2026")) {
    throw new Error("live event page is missing the offer duration or event details");
  }
  if (eventPath === "aie") {
    await readResponse(`${SITE_ORIGIN}/`, {}, 200);
    await readResponse(`${SITE_ORIGIN}/aie/terms`, {}, 200);
    const redirect = await readResponse(`${SITE_ORIGIN}/leap`, { redirect: "manual" }, 302);
    if (new URL(redirect.response.headers.get("location"), SITE_ORIGIN).pathname !== "/aie") {
      throw new Error("live LEAP redirect does not lead to /aie");
    }
  }

  const capsule = await readResponse(
    LEAD_ENDPOINT,
    {
      method: "POST",
      headers: { "content-type": "application/json", origin: SITE_ORIGIN },
      body: "{}"
    },
    400
  );
  if (capsule.response.headers.get("access-control-allow-origin") !== SITE_ORIGIN) {
    throw new Error("lead endpoint did not return the production CORS origin");
  }
}

async function sendTestEmail(address, releaseId) {
  const result = await readResponse(
    LEAD_ENDPOINT,
    {
      method: "POST",
      headers: { "content-type": "application/json", origin: SITE_ORIGIN },
      body: JSON.stringify({
        full_name: "Q9 Test (delete me)",
        company: "Q9 Labs",
        business_email: address,
        phone_whatsapp: "+966000000000",
        product_interest: eventPath === "aie" ? ["ava", "mesa"] : ["ava", "nura", "track", "chalk"],
        utm_source: eventPath === "aie" ? "aie_2026" : "deploy-script",
        utm_medium: "production-test",
        utm_content: `release-${releaseId}`,
        page_url: `${SITE_ORIGIN}/${eventPath}`,
        recaptcha_token: ""
      })
    },
    200
  );
  const body = JSON.parse(result.body);
  if (body.ok !== true) throw new Error(`test lead was not accepted: ${result.body}`);
  console.log(`\nTest lead accepted; confirmation email requested for ${address}.`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const releaseId = makeReleaseId();
  if (options.rollback) {
    await rollbackWebsite(releaseId);
    console.log("Restored the previous Hostinger website release.");
    return;
  }
  console.log(`Q9 Labs website deployment ${releaseId}${options.dryRun ? " (dry run)" : ""}`);

  await preflight();
  await buildWebsite(releaseId);

  if (options.dryRun) {
    await stageWebsite(releaseId, true);
    console.log("\nDry run complete. Production was not changed and no email was sent.");
    return;
  }

  await deployCapsule();
  const remoteStage = await stageWebsite(releaseId, false);
  await activateWebsite(remoteStage);

  try {
    await smokeTest(releaseId);
  } catch (error) {
    console.error(`\nSmoke test failed; rolling Hostinger back to the previous release.`);
    await rollbackWebsite(releaseId);
    throw error;
  }

  if (options.testEmail) await sendTestEmail(options.testEmail, releaseId);

  console.log(`\nDeployment complete: ${releaseId}`);
  console.log(`Website: ${SITE_ORIGIN}/${eventPath}`);
  console.log(`Capsule: ${LEAD_ENDPOINT}`);
  console.log(`Rollback: ${HOSTINGER.root}/.deploy-previous`);
}

main().catch((error) => {
  console.error(`\nDeployment failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
