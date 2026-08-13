require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

// The files we decided to index for this POC
const filesToIndex = [
  "server/controllers/predictController.js",
  "server/routes/predictRoutes.js",
  "server/models/farmerInput.js",
  "client/src/app/api/auth/login/route.ts",
  "client/src/components/layout/Navbar.tsx",
];

const REPO_PATH = path.join(__dirname, "data", "YieldX-SIH-2025");

// Split one file's content into overlapping chunks
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
      startLine: start + 1,
      endLine: end,
      text: chunkText,
    });

    if (end === lines.length) break;
    start = end - overlap;
  }

  return chunks;
}

// Run chunking across all our target files
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

// Get embeddings for MULTIPLE texts in a single batched API call
async function getEmbeddingsBatch(textArray) {
  const response = await cohere.embed({
    texts: textArray,
    model: "embed-english-v3.0",
    inputType: "search_document",
    embeddingTypes: ["float"],
  });
  return response.embeddings.float; // array of vectors, one per input text
}

async function main() {
  const chunks = buildAllChunks();
  console.log(`Total chunks created: ${chunks.length}`);

  const allTexts = chunks.map((chunk) => chunk.text);
  const embeddings = await getEmbeddingsBatch(allTexts);

  // Attach each embedding back to its corresponding chunk
  const indexedChunks = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  console.log(`Generated ${indexedChunks.length} embeddings`);
  console.log(`Each has ${indexedChunks[0].embedding.length} numbers`);

  // Save to disk so we don't have to re-call the API every time
  fs.writeFileSync(
    path.join(__dirname, "data", "index.json"),
    JSON.stringify(indexedChunks, null, 2)
  );
  console.log("Saved to poc/data/index.json");
}

main();