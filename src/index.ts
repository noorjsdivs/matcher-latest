/**
 * matcher-latest - Modern TypeScript pattern matching library
 *
 * A powerful and modern reimplementation of the popular 'matcher' package
 * with enhanced features, TypeScript support, and improved performance.
 *
 * @author Noor Mohammad
 * @license MIT
 */

// Core matching functions
export {
  matcher,
  isMatch,
  matchAdvanced,
  fuzzyMatch,
  matchIgnoreCase,
  partialMatch,
  segmentMatch,
} from "./matcher";

// Types
export type {
  MatcherInput,
  MatcherPattern,
  MatcherOptions,
  MatchResult,
  MatchStats,
  PerformanceMonitor,
} from "./types";

// Utility functions for advanced use cases
export {
  escapeRegExp,
  normalizeString,
  levenshteinDistance,
  calculateSimilarity,
  splitIntoSegments,
  validatePattern,
  clearPatternCache,
  getCacheStats,
} from "./utils";

// Matching engine for custom implementations
export { MatchingEngine } from "./engine";

// Default export for convenience (same as named export 'matcher')
export { matcher as default } from "./matcher";
