const { CohereClientV2 } = require("cohere-ai");

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

const MAX_BATCH_SIZE = 90;

function splitIntoBatches(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Call Cohere's embed API, retrying with exponential backoff on rate limits
async function embedWithRetry(texts, inputType, maxRetries = 4) {
  let attempt = 0;

  while (true) {
    try {
      const response = await cohere.embed({
        texts,
        model: "embed-english-v3.0",
        inputType,
        embeddingTypes: ["float"],
      });
      return response.embeddings.float;
    } catch (err) {
      const isRateLimit = err.statusCode === 429;
      if (!isRateLimit || attempt >= maxRetries) throw err;

      const waitMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s, 16s...
      console.log(`Rate limited. Retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(waitMs);
      attempt++;
    }
  }
}

async function getEmbeddingsBatch(textArray, inputType) {
  const batches = splitIntoBatches(textArray, MAX_BATCH_SIZE);
  let allEmbeddings = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(`Embedding batch ${i + 1} of ${batches.length} (${batches[i].length} texts)...`);
    const embeddings = await embedWithRetry(batches[i], inputType);
    allEmbeddings = allEmbeddings.concat(embeddings);

    // Small pause between batches too, to avoid tripping the per-minute limit in the first place
    if (i < batches.length - 1) await sleep(1500);
  }

  return allEmbeddings;
}

module.exports = { getEmbeddingsBatch };