const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const branch = process.env.AWS_BRANCH || process.env.GITHUB_REF_NAME || "";
const isDevelopmentBranch = /^(dev|develop|development)$/i.test(branch);

if (!apiUrl) {
  console.error("NEXT_PUBLIC_API_URL is required for a production build.");
  process.exit(1);
}

if (branch && !isDevelopmentBranch && (!apiUrl.startsWith("https://") || /localhost|127\.0\.0\.1/i.test(apiUrl))) {
  console.error("NEXT_PUBLIC_API_URL must be an HTTPS API URL and cannot point to localhost on non-development branches.");
  process.exit(1);
}
