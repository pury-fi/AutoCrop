import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const zipOutput = path.resolve(rootDir, "AutoCrop-Plugin.zip");

console.log("[Package] Starting AutoCrop lean production build...");

// 1. Build TypeScript
console.log("[Package] Compiling TypeScript (npm run build)...");
execSync("npm run build", { cwd: rootDir, stdio: "inherit" });

// 2. Prepare staging directory
const stagingDir = path.resolve(os.tmpdir(), `autocrop-pack-${Date.now()}`);
fs.mkdirSync(stagingDir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getDirSize(dir) {
  let size = 0;
  let count = 0;
  function walk(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
        count++;
      }
    }
  }
  walk(dir);
  return { size, count };
}

try {
  console.log("[Package] Staging release files...");

  // Copy root runtime files
  const rootFiles = ["config.json", "start.bat", "README.md", "autocrop.png"];
  for (const file of rootFiles) {
    const srcPath = path.resolve(rootDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.resolve(stagingDir, file));
    }
  }

  // Copy dist/
  copyRecursive(path.resolve(rootDir, "dist"), path.resolve(stagingDir, "dist"));

  // Prepare sanitized package.json for production distribution
  const pkgRaw = fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8");
  const pkg = JSON.parse(pkgRaw);
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    type: pkg.type,
    main: pkg.main,
    scripts: {
      start: "node dist/index.js",
    },
    dependencies: {
      "@pury-fi/plugin-sdk": "^1.0.0",
      ws: pkg.dependencies?.ws || "^8.18.0",
    },
  };
  fs.writeFileSync(path.resolve(stagingDir, "package.json"), JSON.stringify(prodPkg, null, 2), "utf-8");

  // Stage runtime node_modules
  console.log("[Package] Staging minimal runtime dependencies...");
  const stagedNm = path.resolve(stagingDir, "node_modules");
  fs.mkdirSync(stagedNm, { recursive: true });

  // 1. ws
  const wsSrc = path.resolve(rootDir, "node_modules", "ws");
  if (fs.existsSync(wsSrc)) {
    copyRecursive(wsSrc, path.resolve(stagedNm, "ws"));
  }

  // 2. @pury-fi/plugin-sdk (only dist and package.json)
  const sdkSrc = path.resolve(rootDir, "node_modules", "@pury-fi", "plugin-sdk");
  const stagedSdk = path.resolve(stagedNm, "@pury-fi", "plugin-sdk");
  fs.mkdirSync(stagedSdk, { recursive: true });
  fs.copyFileSync(path.resolve(sdkSrc, "package.json"), path.resolve(stagedSdk, "package.json"));
  copyRecursive(path.resolve(sdkSrc, "dist"), path.resolve(stagedSdk, "dist"));

  // 3. @msgpack/msgpack (from nested or hoisted node_modules)
  const nestedMsgpack = path.resolve(sdkSrc, "node_modules", "@msgpack");
  const hoistedMsgpack = path.resolve(rootDir, "node_modules", "@msgpack");
  if (fs.existsSync(nestedMsgpack)) {
    copyRecursive(nestedMsgpack, path.resolve(stagedSdk, "node_modules", "@msgpack"));
  } else if (fs.existsSync(hoistedMsgpack)) {
    copyRecursive(hoistedMsgpack, path.resolve(stagedNm, "@msgpack"));
  }

  // Calculate unpacked size
  const unpacked = getDirSize(stagingDir);
  const unpackedMb = (unpacked.size / (1024 * 1024)).toFixed(2);
  console.log(`[Package] Unpacked size: ${unpackedMb} MB (${unpacked.count} files)`);

  // Remove existing zip if present
  if (fs.existsSync(zipOutput)) {
    fs.unlinkSync(zipOutput);
  }

  // Create Zip archive
  console.log(`[Package] Compressing to ${path.basename(zipOutput)}...`);
  if (process.platform === "win32") {
    const escapedStaging = stagingDir.replace(/'/g, "''");
    const escapedZip = zipOutput.replace(/'/g, "''");
    const psCommand = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedStaging}', '${escapedZip}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`;
    execSync(psCommand, { stdio: "inherit" });
  } else {
    execSync(`cd "${stagingDir}" && zip -q -r "${zipOutput}" .`, { stdio: "inherit" });
  }

  const zipSize = fs.statSync(zipOutput).size;
  const zipMb = (zipSize / (1024 * 1024)).toFixed(2);
  const zipKb = (zipSize / 1024).toFixed(0);
  const ratio = Math.round((1 - zipSize / unpacked.size) * 100);

  console.log(`[Package] Package created successfully!`);
  console.log(`----------------------------------------`);
  console.log(`  File:           ${zipOutput}`);
  console.log(`  Unpacked:       ${unpackedMb} MB (${unpacked.count} files)`);
  console.log(`  Zip size:       ${zipMb} MB (${zipKb} KB)`);
  console.log(`  Compression:    ${ratio}% size reduction`);
  console.log(`----------------------------------------`);
} finally {
  // Clean up staging directory
  try {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}
