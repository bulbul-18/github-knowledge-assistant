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

module.exports = { chunkFile };