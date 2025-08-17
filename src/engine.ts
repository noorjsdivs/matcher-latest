import type {
  MatcherInput,
  MatcherPattern,
  MatcherOptions,
  MatchResult,
} from "./types";
import {
  compilePattern,
  normalizeString,
  fuzzyMatch,
  splitIntoSegments,
  validatePattern,
  getBasePattern,
} from "./utils";

/**
 * Core matching engine that handles the pattern matching logic
 */
export class MatchingEngine {
  private options: Required<MatcherOptions>;

  constructor(options: MatcherOptions = {}) {
    this.options = {
      caseSensitive: false,
      allPatterns: false,
      fuzzyMatch: false,
      fuzzyThreshold: 0.2,
      partialMatch: false,
      wordBoundary: false,
      accentInsensitive: false,
      maxDepth: 10,
      ...options,
    } as Required<MatcherOptions>;
  }

  /**
   * Matches a single input against a single pattern
   */
  public matchSingle(
    input: string,
    pattern: string,
    depth: number = 0
  ): MatchResult {
    if (depth > this.options.maxDepth) {
      throw new Error(
        `Maximum recursion depth (${this.options.maxDepth}) exceeded`
      );
    }

    // Validate pattern
    const validation = validatePattern(pattern);
    if (!validation.valid) {
      throw new Error(`Invalid pattern: ${validation.error}`);
    }

    const normalizedInput = normalizeString(input, this.options);
    const normalizedPattern = normalizeString(pattern, this.options);

    // Handle empty pattern
    if (normalizedPattern === "" || normalizedPattern === "!") {
      return {
        matched: normalizedInput === "",
        input,
        pattern,
        score: normalizedInput === "" ? 1 : 0,
      };
    }

    // Handle fuzzy matching
    if (this.options.fuzzyMatch) {
      const basePattern = getBasePattern(normalizedPattern);
      const fuzzyResult = fuzzyMatch(
        normalizedInput,
        basePattern,
        this.options.fuzzyThreshold
      );
      const isNegated = normalizedPattern.startsWith("!");

      return {
        matched: isNegated ? !fuzzyResult.matched : fuzzyResult.matched,
        input,
        pattern,
        score: fuzzyResult.score,
      };
    }

    // Handle segment-based matching
    if (this.options.separator) {
      return this.matchSegments(normalizedInput, normalizedPattern);
    }

    // Standard regex-based matching
    return this.matchRegex(normalizedInput, normalizedPattern, input, pattern);
  }

  /**
   * Matches input using regex pattern
   */
  private matchRegex(
    normalizedInput: string,
    normalizedPattern: string,
    originalInput: string,
    originalPattern: string
  ): MatchResult {
    const compiled = compilePattern(normalizedPattern, this.options);

    let matched: boolean;

    if (this.options.partialMatch && !compiled.isNegated) {
      // For partial matching, check if pattern matches any substring
      matched =
        compiled.regex.test(normalizedInput) ||
        normalizedInput.includes(normalizedPattern.replace(/[*?]/g, ""));
    } else {
      matched = compiled.regex.test(normalizedInput);
    }

    // Handle negation
    if (compiled.isNegated) {
      matched = !matched;
    }

    return {
      matched,
      input: originalInput,
      pattern: originalPattern,
      score: matched ? 1 : 0,
    };
  }

  /**
   * Matches input using segment-based approach
   */
  private matchSegments(
    normalizedInput: string,
    normalizedPattern: string
  ): MatchResult {
    if (!this.options.separator) {
      throw new Error("Separator is required for segment matching");
    }

    const inputSegments = splitIntoSegments(
      normalizedInput,
      this.options.separator
    );
    const patternSegments = splitIntoSegments(
      getBasePattern(normalizedPattern),
      this.options.separator
    );

    const isNegated = normalizedPattern.startsWith("!");

    // Check if all pattern segments match corresponding input segments
    let matched = true;
    const matchedSegments: string[] = [];

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const inputSegment = inputSegments[i];

      if (!inputSegment || !patternSegment) {
        matched = false;
        break;
      }

      const compiled = compilePattern(patternSegment, this.options);
      if (!compiled.regex.test(inputSegment)) {
        matched = false;
        break;
      }

      matchedSegments.push(inputSegment);
    }

    if (isNegated) {
      matched = !matched;
    }

    return {
      matched,
      input: normalizedInput,
      pattern: normalizedPattern,
      score: matched ? 1 : 0,
      segments: matchedSegments,
    };
  }

  /**
   * Matches input against multiple patterns
   */
  public matchMultiple(
    input: string,
    patterns: readonly string[]
  ): MatchResult {
    if (patterns.length === 0) {
      return { matched: false, input };
    }

    const results: MatchResult[] = patterns.map((pattern) =>
      this.matchSingle(input, pattern)
    );

    // Separate positive and negative patterns
    const positiveResults = results.filter(
      (result) => !result.pattern?.startsWith("!")
    );
    const negativeResults = results.filter((result) =>
      result.pattern?.startsWith("!")
    );

    let matched = false;
    let bestScore = 0;
    let matchedPattern: string | undefined;

    if (this.options.allPatterns) {
      // All positive patterns must match, and no negative patterns should match
      const allPositiveMatch =
        positiveResults.length === 0 || positiveResults.every((r) => r.matched);
      const noNegativeMatch = negativeResults.every((r) => r.matched); // Remember: negated patterns return true when they DON'T match

      matched = allPositiveMatch && noNegativeMatch;

      if (matched && positiveResults.length > 0) {
        const bestResult = positiveResults.reduce((best, current) =>
          (current.score ?? 0) > (best.score ?? 0) ? current : best
        );
        bestScore = bestResult.score ?? 0;
        matchedPattern = bestResult.pattern;
      }
    } else {
      // At least one positive pattern must match, and no negative patterns should match
      const hasPositiveMatch =
        positiveResults.length === 0 || positiveResults.some((r) => r.matched);
      const hasNegativeMatch = negativeResults.some((r) => !r.matched); // A negative pattern "matches" when it returns false

      matched = hasPositiveMatch && !hasNegativeMatch;

      if (matched) {
        const matchedPositive = positiveResults.find((r) => r.matched);
        if (matchedPositive) {
          bestScore = matchedPositive.score ?? 0;
          matchedPattern = matchedPositive.pattern;
        }
      }
    }

    return {
      matched,
      input,
      ...(matchedPattern && { pattern: matchedPattern }),
      score: bestScore,
    };
  }

  /**
   * Updates the matching options
   */
  public setOptions(options: Partial<MatcherOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets the current matching options
   */
  public getOptions(): Required<MatcherOptions> {
    return { ...this.options };
  }
}
