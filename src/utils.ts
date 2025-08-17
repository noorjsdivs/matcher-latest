import type { MatcherOptions, PatternCacheEntry } from "./types";

/**
 * Cache for compiled regex patterns to improve performance
 */
const patternCache = new Map<string, PatternCacheEntry>();

/**
 * Maximum cache size to prevent memory leaks
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Escapes special regex characters except for our wildcard characters
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiles a pattern into a regular expression with caching
 */
export function compilePattern(
  pattern: string,
  options: MatcherOptions = {}
): PatternCacheEntry {
  const cacheKey = `${pattern}:${JSON.stringify(options)}`;

  // Check cache first
  const cached = patternCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Clean cache if it gets too large
  if (patternCache.size >= MAX_CACHE_SIZE) {
    const oldestEntry = patternCache.keys().next().value;
    if (oldestEntry) {
      patternCache.delete(oldestEntry);
    }
  }

  const isNegated = pattern.startsWith("!");
  const cleanPattern = isNegated ? pattern.slice(1) : pattern;

  // First escape regex characters except * and ?
  let regexPattern = cleanPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  // Replace ? first, then *
  regexPattern = regexPattern
    .replace(/\?/g, ".") // Replace ? with single character match
    .replace(/\*/g, ".*"); // Replace * with match

  // Handle word boundaries
  if (options.wordBoundary) {
    regexPattern = `\\b${regexPattern}\\b`;
  }

  // Handle separator-based matching
  if (options.separator) {
    const escapedSeparator = escapeRegExp(options.separator);
    regexPattern = regexPattern.replace(
      new RegExp(escapedSeparator, "g"),
      ".*?"
    );
  }

  const flags = options.caseSensitive ? "" : "i";
  const regex = new RegExp(`^${regexPattern}$`, flags);

  const entry: PatternCacheEntry = {
    regex,
    isNegated,
    originalPattern: pattern,
    compiledAt: Date.now(),
  };

  patternCache.set(cacheKey, entry);
  return entry;
}

/**
 * Normalizes a string based on options
 */
export function normalizeString(
  input: string,
  options: MatcherOptions = {}
): string {
  let normalized = input;

  if (!options.caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  if (options.accentInsensitive) {
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  return normalized;
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= a.length; i++) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0]![j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return matrix[a.length]![b.length]!;
}

/**
 * Calculates similarity score between two strings (0-1, higher is better)
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Performs fuzzy matching between input and pattern
 */
export function fuzzyMatch(
  input: string,
  pattern: string,
  threshold: number = 0.2
): { matched: boolean; score: number } {
  const normalizedInput = input.toLowerCase();
  const normalizedPattern = pattern.toLowerCase().replace(/[*?!]/g, "");

  if (normalizedPattern === "") {
    return { matched: true, score: 1 };
  }

  // Try exact substring match first
  if (normalizedInput.includes(normalizedPattern)) {
    return { matched: true, score: 0.9 };
  }

  const score = calculateSimilarity(normalizedInput, normalizedPattern);
  const matched = score >= threshold;

  return { matched, score };
}

/**
 * Splits input into segments based on separator
 */
export function splitIntoSegments(input: string, separator?: string): string[] {
  if (!separator) {
    return [input];
  }
  return input.split(separator).filter((segment) => segment.length > 0);
}

/**
 * Checks if a string contains only wildcard characters
 */
export function isWildcardOnly(pattern: string): boolean {
  return /^[*?!]*$/.test(pattern);
}

/**
 * Extracts the base pattern without negation prefix
 */
export function getBasePattern(pattern: string): string {
  return pattern.startsWith("!") ? pattern.slice(1) : pattern;
}

/**
 * Validates pattern syntax
 */
export function validatePattern(pattern: string): {
  valid: boolean;
  error?: string;
} {
  if (typeof pattern !== "string") {
    return { valid: false, error: "Pattern must be a string" };
  }

  if (pattern.length === 0) {
    return { valid: true };
  }

  // Check for unescaped regex special characters that we don't support
  const unsupportedChars = /[+^${}()|[\]\\]/g;
  const matches = pattern.match(unsupportedChars);
  if (matches) {
    const unescapedMatches = matches.filter((char, index) => {
      const charIndex = pattern.indexOf(char);
      return charIndex === 0 || pattern[charIndex - 1] !== "\\";
    });

    if (unescapedMatches.length > 0) {
      return {
        valid: false,
        error: `Unsupported characters found: ${unescapedMatches.join(
          ", "
        )}. Use \\\\ to escape them.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Clears the pattern cache
 */
export function clearPatternCache(): void {
  patternCache.clear();
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: patternCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
