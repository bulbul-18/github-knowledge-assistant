const EXCLUDED_DIRS = ["node_modules", ".git", "dist", "build", ".next", "vendor", ".vercel"];
const ALLOWED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".py", ".md", ".json"];
const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100 KB

function shouldIndexFile(filePath, sizeInBytes) {
  const isInExcludedDir = EXCLUDED_DIRS.some((dir) => filePath.includes(`${dir}/`));
  if (isInExcludedDir) return false;

  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => filePath.endsWith(ext));
  if (!hasAllowedExtension) return false;

  if (sizeInBytes > MAX_FILE_SIZE_BYTES) return false;

  return true;
}

// Parse a GitHub URL like "https://github.com/owner/repo" into { owner, repo }
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// Fetch the full file tree for a repo (paths + metadata, no content yet)
async function fetchRepoTree(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch repo tree: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.tree.filter((item) => item.type === "blob"); // only files, not folders
}

// Fetch the raw text content of one specific file
async function fetchFileContent(owner, repo, filePath) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${filePath}`);
  }

  return response.text();
}

module.exports = { parseGitHubUrl, fetchRepoTree, fetchFileContent, shouldIndexFile };