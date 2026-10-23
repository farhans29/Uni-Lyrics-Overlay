const fs = require("node:fs");
const path = require("node:path");

/**
 * Standard SemVer 2.0.0 Version Manager
 * Supports: patch | minor | major | explicit X.Y.Z
 * Optional 2nd argument: custom changelog bullet description.
 * Automatically updates package.json and prepends a new release section in CHANGELOG.md.
 */

const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

function parseSemVer(versionStr) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(versionStr).trim());
  if (!match) {
    throw new Error(`Invalid SemVer string: "${versionStr}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

function computeNextVersion(currentVersion, bumpType) {
  const v = parseSemVer(currentVersion);
  switch (bumpType) {
    case "major":
      return `${v.major + 1}.0.0`;
    case "minor":
      return `${v.major}.${v.minor + 1}.0`;
    case "patch":
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    default:
      parseSemVer(bumpType);
      return bumpType;
  }
}

function updateChangelog(newVersion, message) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const summaryLine = message ? `- ${message}` : `- Version bump to v${newVersion}.`;
  const newEntry = `## [${newVersion}] - ${dateStr}\n\n### Changed\n${summaryLine}\n\n`;

  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(
      changelogPath,
      `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newEntry}`,
      "utf8"
    );
    return;
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  if (content.includes(`## [${newVersion}]`)) {
    return;
  }

  const firstReleaseIndex = content.indexOf("## [");
  if (firstReleaseIndex === -1) {
    fs.writeFileSync(changelogPath, `${content.trimEnd()}\n\n${newEntry}`, "utf8");
  } else {
    const updated =
      content.slice(0, firstReleaseIndex) + newEntry + content.slice(firstReleaseIndex);
    fs.writeFileSync(changelogPath, updated, "utf8");
  }
}

function run() {
  const arg = process.argv[2];
  const customMessage = process.argv.slice(3).join(" ").trim();
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  if (!arg) {
    console.log(`Current version: v${pkg.version}`);
    return;
  }

  const nextVersion = computeNextVersion(pkg.version, arg);
  pkg.version = nextVersion;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  updateChangelog(nextVersion, customMessage);

  console.log(`✅ Version updated to v${nextVersion} in package.json and CHANGELOG.md`);
}

run();
