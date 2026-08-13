require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

// Step 1: cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  return dotProduct / (magnitudeA * magnitudeB);
}

// Step 2: embed the user's question
async function embedQuestion(question) {
  const response = await cohere.embed({
    texts: [question],
    model: "embed-english-v3.0",
    inputType: "search_query", // different from indexing! this is a query, not a document
    embeddingTypes: ["float"],
  });
  return response.embeddings.float[0];
}

// Step 3: find the top-k most similar chunks
function findTopChunks(questionEmbedding, allChunks, k = 3) {
  const scored = allChunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score); // highest score first

  return scored.slice(0, k);
}

// Step 4: ask the question, end to end
async function askQuestion(question) {
  const indexPath = path.join(__dirname, "data", "index.json");
  const allChunks = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  const questionEmbedding = await embedQuestion(question);
  const topChunks = findTopChunks(questionEmbedding, allChunks, 3);

  console.log("\n--- Top matching chunks ---");
  topChunks.forEach((chunk, i) => {
    console.log(
      `${i + 1}. ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine}) — score: ${chunk.score.toFixed(3)}`
    );
  });
}

// Simple terminal input loop
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Ask a question about the repo: ", async (question) => {
  await askQuestion(question);
  rl.close();
});