import { createHash, randomBytes } from 'crypto'

/**
 * Generates a random string for PKCE verification
 * @returns A random string of 43-128 characters
 */
export function generatePKCEVerifier(): string {
  const verifier = randomBytes(32).toString('base64url')
  return verifier
}

/**
 * Creates a PKCE challenge from a verifier string
 * @param verifier The PKCE verifier string
 * @returns The PKCE challenge string
 */
export function generatePKCEChallenge(verifier: string): string {
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url')
  return challenge
}

/**
 * Validates a PKCE code verifier against a challenge
 * @param verifier The PKCE verifier string
 * @param challenge The PKCE challenge string
 * @returns boolean indicating if the verifier matches the challenge
 */
export function validatePKCEChallenge(verifier: string, challenge: string): boolean {
  const computedChallenge = generatePKCEChallenge(verifier)
  return computedChallenge === challenge
} 