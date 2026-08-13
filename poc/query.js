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
    inputType: "search_query",
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

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

// Step 4: build a constrained prompt and generate an answer
async function generateAnswer(question, topChunks) {
  const context = topChunks
    .map(
      (chunk) =>
        `File: ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})\n${chunk.text}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are answering questions about a codebase using ONLY the code snippets provided below.

Rules:
- Only use the information in the provided code snippets to answer.
- If the answer is not clearly present in the snippets, say "I couldn't find enough information in the indexed code to answer this confidently."
- When you do answer, mention which file(s) your answer is based on.

Code snippets:
${context}

Question: ${question}

Answer:`;

  const response = await cohere.chat({
    model: "command-a-03-2025",
    messages: [{ role: "user", content: prompt }],
  });

  return response.message.content[0].text;
}

// Step 5: ask the question, end to end
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

  const answer = await generateAnswer(question, topChunks);
  console.log("\n--- Answer ---");
  console.log(answer);
}

// Simple terminal input loop
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Ask a question about the repo: ", async (question) => {
  await askQuestion(question);
  rl.close();
});