const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

async function getEmbeddingsBatch(textArray, inputType) {
  const response = await cohere.embed({
    texts: textArray,
    model: "embed-english-v3.0",
    inputType,
    embeddingTypes: ["float"],
  });
  return response.embeddings.float;
}

module.exports = { getEmbeddingsBatch };