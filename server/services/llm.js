const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function findTopChunks(questionEmbedding, allChunks, k = 3) {
  const scored = allChunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

async function generateAnswer(question, topChunks) {
  const context = topChunks
    .map((chunk) => `File: ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})\n${chunk.text}`)
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

module.exports = { findTopChunks, generateAnswer };