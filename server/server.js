require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const { parseGitHubUrl, fetchRepoTree, fetchFileContent, shouldIndexFile } = require("./services/github");
const { chunkFile } = require("./services/chunker");
const { getEmbeddingsBatch } = require("./services/embeddings");
const { findTopChunks, generateAnswer } = require("./services/llm");
const prisma = require("./lib/prisma");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/index", async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    const { owner, repo } = parseGitHubUrl(repoUrl);
    const repoName = `${owner}/${repo}`;
    console.log(`Indexing ${repoName}...`);

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

    // Step 3: embed all chunks
    const texts = allChunks.map((chunk) => chunk.text);
    const embeddings = await getEmbeddingsBatch(texts, "search_document");

    // Step 4: find or create the Repository row
    let repository = await prisma.repository.findFirst({ where: { url: repoUrl } });
    if (repository) {
      // Re-indexing: wipe old chunks, keep the repository (and its chat sessions) intact
      await prisma.chunk.deleteMany({ where: { repositoryId: repository.id } });
    } else {
      repository = await prisma.repository.create({
        data: { url: repoUrl, name: repoName },
      });
    }

    // Step 5: insert chunks with embeddings via raw SQL (pgvector isn't natively supported by Prisma's normal API)
    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const embeddingLiteral = `[${embeddings[i].join(",")}]`;
      const id = crypto.randomUUID();

      await prisma.$executeRaw`
        INSERT INTO "Chunk" (id, "repositoryId", "filePath", "startLine", "endLine", text, embedding)
        VALUES (${id}, ${repository.id}, ${chunk.filePath}, ${chunk.startLine}, ${chunk.endLine}, ${chunk.text}, ${embeddingLiteral}::vector)
      `;
    }

    res.json({ status: "ready", repositoryId: repository.id, repo: repoName, chunksIndexed: allChunks.length });
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

    const [questionEmbedding] = await getEmbeddingsBatch([question], "search_query");

    // Temporary: still using the old in-memory approach for retrieval — updated in the next step
    res.status(400).json({ error: "ask endpoint not yet updated for database storage" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));