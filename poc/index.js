const fs = require("fs");
const path = require("path");

// Step 1: the files we decided to index for this POC
const filesToIndex = [
  "server/controllers/predictController.js",
  "server/routes/predictRoutes.js",
  "server/models/farmerInput.js",
  "client/src/app/api/auth/login/route.ts",
  "client/src/components/layout/Navbar.tsx",
];

const REPO_PATH = path.join(__dirname, "data", "YieldX-SIH-2025");

// Step 2: split one file's content into overlapping chunks
function chunkFile(content, filePath) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const chunkSize = 40;
  const overlap = 5;
  const chunks = [];

  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + chunkSize, lines.length);
    const chunkText = lines.slice(start, end).join("\n");

    chunks.push({
      filePath,
      startLine: start + 1, // +1 so line numbers are human-friendly (1-indexed)
      endLine: end,
      text: chunkText,
    });

    if (end === lines.length) break; // reached the end of the file
    start = end - overlap; // move forward, but re-include the last `overlap` lines
  }

  return chunks;
}

// Step 3: run chunking across all our target files
function buildAllChunks() {
  let allChunks = [];

  for (const relativePath of filesToIndex) {
    const fullPath = path.join(REPO_PATH, relativePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    const chunks = chunkFile(content, relativePath);
    allChunks = allChunks.concat(chunks);
  }

  return allChunks;
}

const chunks = buildAllChunks();
console.log(`Total chunks created: ${chunks.length}`);
console.log(chunks[0]); // preview the very first chunk