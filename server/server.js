require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { parseGitHubUrl, fetchRepoTree, fetchFileContent, shouldIndexFile } = require("./services/github");
const { chunkFile } = require("./services/chunker");
const { getEmbeddingsBatch } = require("./services/embeddings");
const { findTopChunks, generateAnswer } = require("./services/llm");

const app = express();
app.use(cors());
app.use(express.json());

// Temporary in-memory storage — one repo at a time, no database yet
let indexedChunks = [];
let currentRepo = null;

app.post("/api/index", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    const { owner, repo } = parseGitHubUrl(repoUrl);
    console.log(`Indexing ${owner}/${repo}...`);

    // Step 1: get the file tree
    const tree = await fetchRepoTree(owner, repo);
    const filesToIndex = tree.filter((item) => shouldIndexFile(item.path, item.size));
    console.log(`${filesToIndex.length} files selected out of ${tree.length} total`);

    // Step 2: fetch content and chunk each file
    let allChunks = [];
    for (const file of filesToIndex) {
      try {
        const content = await fetchFileContent(owner, repo, file.path);
        const chunks = chunkFile(content, file.path);
        allChunks = allChunks.concat(chunks);
      } catch (err) {
        console.warn(`Skipping ${file.path}: ${err.message}`);
      }
    }
    console.log(`${allChunks.length} chunks created`);

    // Step 3: embed all chunks in one batch
    const texts = allChunks.map((chunk) => chunk.text);
    const embeddings = await getEmbeddingsBatch(texts, "search_document");

    indexedChunks = allChunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
    currentRepo = `${owner}/${repo}`;

    res.json({ status: "ready", repo: currentRepo, chunksIndexed: indexedChunks.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    if (indexedChunks.length === 0) {
      return res.status(400).json({ error: "No repository has been indexed yet" });
    }

    const [questionEmbedding] = await getEmbeddingsBatch([question], "search_query");
    const topChunks = findTopChunks(questionEmbedding, indexedChunks, 3);
    const answer = await generateAnswer(question, topChunks);

    res.json({
      answer,
      sources: topChunks.map((c) => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine, score: c.score })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));