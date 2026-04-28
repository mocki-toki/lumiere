import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const TAG_PREFIX = "lumiere-v";
const BASE_BRANCH = process.env.BASE_BRANCH || "origin/main";
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

const run = (cmd, opts = {}) =>
  execSync(cmd, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    ...opts,
  }).trim();

const maybeRun = (cmd, opts = {}) => {
  try {
    return { ok: true, out: run(cmd, opts) };
  } catch {
    return { ok: false, out: "" };
  }
};

const setOutput = (key, value) => {
  if (!GITHUB_OUTPUT) return;
  fs.appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`);
};

const getLastForkTag = () => {
  const cmd = `git tag --merged HEAD --list '${TAG_PREFIX}*' --sort=-v:refname | head -n 1`;
  return run(cmd);
};

const parseVersion = (version) => {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Invalid version: ${version}`);
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
  };
};

const versionToString = ({ major, minor, patch }) => `${major}.${minor}.${patch}`;

const bumpVersion = (version, bump) => {
  const v = parseVersion(version);
  if (bump === "major") return `${v.major + 1}.0.0`;
  if (bump === "minor") return `${v.major}.${v.minor + 1}.0`;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
};

const getCurrentLumiereVersion = () => {
  const versionFile = path.join(root, "src/app/branding/version.ts");
  const content = fs.readFileSync(versionFile, "utf8");
  const m = content.match(/export const LUMIERE_VERSION = '([^']+)'/);
  if (!m) throw new Error("Could not find LUMIERE_VERSION in version.ts");
  return m[1];
};

const getCinnyVersionFromBase = () => {
  const raw = run(`git show ${BASE_BRANCH}:package.json`);
  const pkg = JSON.parse(raw);
  if (!pkg.version || typeof pkg.version !== "string") {
    throw new Error(`Invalid package version from ${BASE_BRANCH}`);
  }
  return pkg.version;
};

const getCommitCandidates = (lastTag) => {
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  const out = run(`git rev-list --reverse ${range}`);
  return out ? out.split("\n").filter(Boolean) : [];
};

const isReachableFromBase = (commit) =>
  maybeRun(`git merge-base --is-ancestor ${commit} ${BASE_BRANCH}`).ok;

const getCommitMessage = (commit) => {
  const subject = run(`git log -1 --format=%s ${commit}`);
  const body = run(`git log -1 --format=%b ${commit}`);
  return { subject, body };
};

const classifyCommit = ({ subject, body }) => {
  if (subject.startsWith("chore(release): lumiere v")) return "none";
  if (/BREAKING CHANGE:/i.test(body) || /BREAKING-CHANGE:/i.test(body)) return "major";
  const header = subject.match(/^([a-zA-Z]+)(\([^)]+\))?(!)?:/);
  if (!header) return "none";
  const type = header[1].toLowerCase();
  const bang = Boolean(header[3]);
  if (bang) return "major";
  if (type === "feat") return "minor";
  if (type === "fix" || type === "perf") return "patch";
  return "none";
};

const highestBump = (levels) => {
  if (levels.includes("major")) return "major";
  if (levels.includes("minor")) return "minor";
  if (levels.includes("patch")) return "patch";
  return "none";
};

const updateVersionFile = (cinnyVersion, lumiereVersion) => {
  const versionFile = path.join(root, "src/app/branding/version.ts");
  let content = fs.readFileSync(versionFile, "utf8");
  content = content.replace(
    /export const CINNY_VERSION = '[^']+';/,
    `export const CINNY_VERSION = '${cinnyVersion}';`
  );
  content = content.replace(
    /export const LUMIERE_VERSION = '[^']+';/,
    `export const LUMIERE_VERSION = '${lumiereVersion}';`
  );
  fs.writeFileSync(versionFile, content);
};

const commitsToNotes = (commitMessages) => {
  if (commitMessages.length === 0) return "No fork commit messages to include.";
  return commitMessages.map((c) => `- ${c.subject} (${c.sha.slice(0, 7)})`).join("\n");
};

const main = () => {
  const lastTag = getLastForkTag();
  const currentVersion = lastTag ? lastTag.replace(TAG_PREFIX, "") : getCurrentLumiereVersion();
  const cinnyVersion = getCinnyVersionFromBase();

  const candidates = getCommitCandidates(lastTag);
  const relevant = [];
  for (const sha of candidates) {
    if (isReachableFromBase(sha)) continue;
    const msg = getCommitMessage(sha);
    const level = classifyCommit(msg);
    relevant.push({ sha, ...msg, level });
  }

  const bump = highestBump(relevant.map((r) => r.level));
  if (bump === "none") {
    setOutput("should_release", "false");
    setOutput("bump", "none");
    setOutput("cinny_version", cinnyVersion);
    setOutput("lumiere_version", currentVersion);
    setOutput("tag_name", `${TAG_PREFIX}${currentVersion}`);
    setOutput("release_notes_file", "");
    return;
  }

  const nextVersion = bumpVersion(currentVersion, bump);
  updateVersionFile(cinnyVersion, nextVersion);
  const tag = `${TAG_PREFIX}${nextVersion}`;

  const notesPath = path.join(root, "release-notes-lumiere.md");
  const notes = [
    `Lumiere ${nextVersion}`,
    "",
    `Based on Cinny ${cinnyVersion}`,
    "",
    "Included fork commits:",
    commitsToNotes(relevant),
  ].join("\n");
  fs.writeFileSync(notesPath, `${notes}\n`);

  setOutput("should_release", "true");
  setOutput("bump", bump);
  setOutput("cinny_version", cinnyVersion);
  setOutput("lumiere_version", nextVersion);
  setOutput("tag_name", tag);
  setOutput("release_notes_file", notesPath);
};

main();
