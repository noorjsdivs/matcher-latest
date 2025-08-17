/**
 * Options for pattern matching operations
 */
export interface MatcherOptions {
  /**
   * Treat uppercase and lowercase characters as being the same
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Require all negated patterns to not match and any normal patterns to match at least once
   * @default false
   */
  allPatterns?: boolean;

  /**
   * Enable fuzzy matching for approximate string matching
   * @default false
   */
  fuzzyMatch?: boolean;

  /**
   * Maximum edit distance for fuzzy matching (0-1 as percentage, or integer for Levenshtein distance)
   * @default 0.2
   */
  fuzzyThreshold?: number;

  /**
   * Enable partial matching (substring matching)
   * @default false
   */
  partialMatch?: boolean;

  /**
   * Custom separator for multi-segment matching
   * @default undefined
   */
  separator?: string;

  /**
   * Enable word boundary matching
   * @default false
   */
  wordBoundary?: boolean;

  /**
   * Enable accent-insensitive matching (normalize accented characters)
   * @default false
   */
  accentInsensitive?: boolean;

  /**
   * Maximum recursion depth for nested pattern matching
   * @default 10
   */
  maxDepth?: number;
}

/**
 * Input type for matcher functions - can be string or array of strings
 */
export type MatcherInput = string | readonly string[];

/**
 * Pattern type - can be string or array of strings
 */
export type MatcherPattern = string | readonly string[];

/**
 * Result of pattern matching with additional metadata
 */
export interface MatchResult {
  /**
   * Whether the pattern matched
   */
  matched: boolean;

  /**
   * The input that was matched (if any)
   */
  input?: string;

  /**
   * The pattern that matched (if any)
   */
  pattern?: string;

  /**
   * Match score for fuzzy matching (0-1, higher is better)
   */
  score?: number;

  /**
   * Matched segments for multi-segment patterns
   */
  segments?: string[];

  /**
   * Additional metadata about the match
   */
  metadata?: Record<string, unknown>;
}

/**
 * Advanced matching statistics
 */
export interface MatchStats {
  /**
   * Total number of inputs processed
   */
  totalInputs: number;

  /**
   * Total number of patterns processed
   */
  totalPatterns: number;

  /**
   * Number of successful matches
   */
  matchCount: number;

  /**
   * Average match score (for fuzzy matching)
   */
  averageScore?: number;

  /**
   * Processing time in milliseconds
   */
  processingTime: number;
}

/**
 * Cache entry for compiled patterns
 */
export interface PatternCacheEntry {
  regex: RegExp;
  isNegated: boolean;
  originalPattern: string;
  compiledAt: number;
}

/**
 * Performance monitoring interface
 */
export interface PerformanceMonitor {
  start(): void;
  end(): number;
  getStats(): MatchStats;
}
