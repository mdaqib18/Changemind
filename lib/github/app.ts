import "server-only";

import { createHash, createSign, randomBytes } from "node:crypto";

type GitHubInstallation = {
  id: number;
  account: { id: number; login: string; type: string } | null;
};

export const githubInstallStateCookie = "changemind_github_install_state";

export function createGitHubInstallState() {
  const value = randomBytes(32).toString("base64url");
  return { value, hash: hashGitHubInstallState(value) };
}

export function hashGitHubInstallState(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createGitHubAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) throw new Error("GitHub App configuration is incomplete.");

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: appId })).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  return `${header}.${payload}.${signer.sign(privateKey, "base64url")}`;
}

export async function getGitHubInstallation(installationId: string): Promise<GitHubInstallation> {
  const response = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(installationId)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${createGitHubAppJwt()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("GitHub could not verify this installation.");
  return response.json() as Promise<GitHubInstallation>;
}
