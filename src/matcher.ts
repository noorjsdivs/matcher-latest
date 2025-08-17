import type {
  MatcherInput,
  MatcherPattern,
  MatcherOptions,
  MatchResult,
  MatchStats,
  PerformanceMonitor,
} from "./types";
import { MatchingEngine } from "./engine";

/**
 * Performance monitor implementation
 */
class SimplePerformanceMonitor implements PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private stats: MatchStats = {
    totalInputs: 0,
    totalPatterns: 0,
    matchCount: 0,
    processingTime: 0,
  };

  start(): void {
    this.startTime = Date.now();
  }

  end(): number {
    this.endTime = Date.now();
    this.stats.processingTime = this.endTime - this.startTime;
    return this.stats.processingTime;
  }

  getStats(): MatchStats {
    return { ...this.stats };
  }

  updateStats(inputs: number, patterns: number, matches: number): void {
    this.stats.totalInputs += inputs;
    this.stats.totalPatterns += patterns;
    this.stats.matchCount += matches;
  }
}

/**
 * Converts input to array format for consistent processing
 */
function normalizeInput(input: MatcherInput): string[] {
  if (Array.isArray(input)) {
    return [...input];
  }
  return [input as string];
}

/**
 * Converts patterns to array format for consistent processing
 */
function normalizePatterns(patterns: MatcherPattern): string[] {
  if (Array.isArray(patterns)) {
    return [...patterns];
  }
  return [patterns as string];
}

/**
 * Filters an array of inputs based on patterns, similar to the original matcher
 *
 * @param inputs - String or array of strings to filter
 * @param patterns - Pattern or array of patterns to match against
 * @param options - Matching options
 * @returns Array of inputs that match the patterns
 *
 * @example
 * ```typescript
 * matcher(['foo', 'bar', 'baz'], ['*ar', '!foo']);
 * //=> ['bar']
 *
 * matcher(['test.js', 'test.ts', 'readme.md'], '*.ts');
 * //=> ['test.ts']
 * ```
 */
export function matcher(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  options: MatcherOptions = {}
): string[] {
  const monitor = new SimplePerformanceMonitor();
  monitor.start();

  const normalizedInputs = normalizeInput(inputs);
  const normalizedPatterns = normalizePatterns(patterns);

  if (normalizedInputs.length === 0 || normalizedPatterns.length === 0) {
    monitor.end();
    return [];
  }

  const engine = new MatchingEngine(options);
  const results: string[] = [];

  for (const input of normalizedInputs) {
    const result = engine.matchMultiple(input, normalizedPatterns);
    if (result.matched) {
      results.push(input);
    }
  }

  monitor.updateStats(
    normalizedInputs.length,
    normalizedPatterns.length,
    results.length
  );
  monitor.end();

  return results;
}

/**
 * Checks if inputs match patterns, similar to the original isMatch
 *
 * @param inputs - String or array of strings to check
 * @param patterns - Pattern or array of patterns to match against
 * @param options - Matching options
 * @returns True if any input matches all patterns
 *
 * @example
 * ```typescript
 * isMatch('unicorn', 'uni*');
 * //=> true
 *
 * isMatch(['foo', 'bar'], 'f*');
 * //=> true
 *
 * isMatch('test', '!test');
 * //=> false
 * ```
 */
export function isMatch(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  options: MatcherOptions = {}
): boolean {
  const normalizedInputs = normalizeInput(inputs);
  const normalizedPatterns = normalizePatterns(patterns);

  if (normalizedInputs.length === 0 && normalizedPatterns.length === 0) {
    return false;
  }

  if (normalizedInputs.length === 0 || normalizedPatterns.length === 0) {
    return false;
  }

  const engine = new MatchingEngine(options);

  // Check if any input matches all patterns
  for (const input of normalizedInputs) {
    const result = engine.matchMultiple(input, normalizedPatterns);
    if (result.matched) {
      return true;
    }
  }

  return false;
}

/**
 * Advanced matching function that returns detailed match results
 *
 * @param inputs - String or array of strings to match
 * @param patterns - Pattern or array of patterns to match against
 * @param options - Matching options
 * @returns Detailed match results with scores and metadata
 *
 * @example
 * ```typescript
 * const results = matchAdvanced(['foo', 'bar'], ['f*'], { fuzzyMatch: true });
 * console.log(results[0]?.score); // Match score for 'foo'
 * ```
 */
export function matchAdvanced(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  options: MatcherOptions = {}
): MatchResult[] {
  const monitor = new SimplePerformanceMonitor();
  monitor.start();

  const normalizedInputs = normalizeInput(inputs);
  const normalizedPatterns = normalizePatterns(patterns);

  if (normalizedInputs.length === 0 || normalizedPatterns.length === 0) {
    monitor.end();
    return [];
  }

  const engine = new MatchingEngine(options);
  const results: MatchResult[] = [];

  for (const input of normalizedInputs) {
    const result = engine.matchMultiple(input, normalizedPatterns);
    if (result.matched) {
      results.push({
        ...result,
        metadata: {
          processingTime: monitor.end(),
          options: engine.getOptions(),
        },
      });
      monitor.start(); // Restart for next iteration
    }
  }

  monitor.updateStats(
    normalizedInputs.length,
    normalizedPatterns.length,
    results.length
  );

  return results;
}

/**
 * Fuzzy matching function for approximate string matching
 *
 * @param inputs - String or array of strings to match
 * @param patterns - Pattern or array of patterns to match against
 * @param threshold - Similarity threshold (0-1, higher means more similar)
 * @param options - Additional matching options
 * @returns Array of fuzzy match results with scores
 *
 * @example
 * ```typescript
 * const results = fuzzyMatch(['hello', 'world'], 'helo', 0.8);
 * //=> [{ matched: true, input: 'hello', score: 0.9, ... }]
 * ```
 */
export function fuzzyMatch(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  threshold: number = 0.2,
  options: Omit<MatcherOptions, "fuzzyMatch" | "fuzzyThreshold"> = {}
): MatchResult[] {
  return matchAdvanced(inputs, patterns, {
    ...options,
    fuzzyMatch: true,
    fuzzyThreshold: threshold,
  });
}

/**
 * Case-insensitive matching function
 *
 * @param inputs - String or array of strings to match
 * @param patterns - Pattern or array of patterns to match against
 * @param options - Additional matching options
 * @returns Array of matched inputs
 *
 * @example
 * ```typescript
 * matchIgnoreCase(['Hello', 'WORLD'], 'hello');
 * //=> ['Hello']
 * ```
 */
export function matchIgnoreCase(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  options: Omit<MatcherOptions, "caseSensitive"> = {}
): string[] {
  return matcher(inputs, patterns, {
    ...options,
    caseSensitive: false,
  });
}

/**
 * Partial matching function that matches substrings
 *
 * @param inputs - String or array of strings to match
 * @param patterns - Pattern or array of patterns to match against
 * @param options - Additional matching options
 * @returns Array of matched inputs
 *
 * @example
 * ```typescript
 * partialMatch(['hello world', 'foo bar'], 'wor');
 * //=> ['hello world']
 * ```
 */
export function partialMatch(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  options: Omit<MatcherOptions, "partialMatch"> = {}
): string[] {
  return matcher(inputs, patterns, {
    ...options,
    partialMatch: true,
  });
}

/**
 * Multi-segment matching with custom separators
 *
 * @param inputs - String or array of strings to match
 * @param patterns - Pattern or array of patterns to match against
 * @param separator - Separator to split inputs and patterns
 * @param options - Additional matching options
 * @returns Array of matched inputs
 *
 * @example
 * ```typescript
 * segmentMatch(['foo/bar/baz', 'test/file'], 'foo/star/baz', '/');
 * //=> ['foo/bar/baz']
 * ```
 */
export function segmentMatch(
  inputs: MatcherInput,
  patterns: MatcherPattern,
  separator: string,
  options: Omit<MatcherOptions, "separator"> = {}
): string[] {
  return matcher(inputs, patterns, {
    ...options,
    separator,
  });
}

// Re-export types for public API
export type {
  MatcherInput,
  MatcherPattern,
  MatcherOptions,
  MatchResult,
  MatchStats,
  PerformanceMonitor,
};
