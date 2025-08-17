import {
  escapeRegExp,
  normalizeString,
  levenshteinDistance,
  calculateSimilarity,
  compilePattern,
  validatePattern,
  clearPatternCache,
  getCacheStats,
} from "../src/utils";

describe("utils", () => {
  describe("escapeRegExp", () => {
    test("should escape regex special characters", () => {
      expect(escapeRegExp("test.file")).toBe("test\\.file");
      expect(escapeRegExp("test+pattern")).toBe("test\\+pattern");
      expect(escapeRegExp("test[abc]")).toBe("test\\[abc\\]");
    });

    test("should not escape wildcards", () => {
      expect(escapeRegExp("test*pattern")).toBe("test*pattern");
      expect(escapeRegExp("test?pattern")).toBe("test?pattern");
    });
  });

  describe("normalizeString", () => {
    test("should handle case sensitivity", () => {
      expect(normalizeString("Test", { caseSensitive: false })).toBe("test");
      expect(normalizeString("Test", { caseSensitive: true })).toBe("Test");
    });

    test("should handle accent insensitive", () => {
      expect(normalizeString("café", { accentInsensitive: true })).toBe("cafe");
      expect(normalizeString("naïve", { accentInsensitive: true })).toBe(
        "naive"
      );
    });
  });

  describe("levenshteinDistance", () => {
    test("should calculate correct distances", () => {
      expect(levenshteinDistance("", "")).toBe(0);
      expect(levenshteinDistance("test", "")).toBe(4);
      expect(levenshteinDistance("", "test")).toBe(4);
      expect(levenshteinDistance("test", "test")).toBe(0);
      expect(levenshteinDistance("test", "best")).toBe(1);
      expect(levenshteinDistance("hello", "helo")).toBe(1);
    });
  });

  describe("calculateSimilarity", () => {
    test("should calculate similarity scores", () => {
      expect(calculateSimilarity("test", "test")).toBe(1);
      expect(calculateSimilarity("", "")).toBe(1);
      expect(calculateSimilarity("test", "")).toBe(0);
      expect(calculateSimilarity("hello", "helo")).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe("compilePattern", () => {
    beforeEach(() => {
      clearPatternCache();
    });

    test("should compile basic patterns", () => {
      const pattern = compilePattern("test*");
      expect(pattern.regex.test("testing")).toBe(true);
      expect(pattern.regex.test("test")).toBe(true);
      expect(pattern.regex.test("best")).toBe(false);
      expect(pattern.isNegated).toBe(false);
    });

    test("should handle negated patterns", () => {
      const pattern = compilePattern("!test*");
      expect(pattern.isNegated).toBe(true);
      expect(pattern.regex.test("testing")).toBe(true);
    });

    test("should cache compiled patterns", () => {
      compilePattern("test*");
      const stats = getCacheStats();
      expect(stats.size).toBe(1);
    });
  });

  describe("validatePattern", () => {
    test("should validate correct patterns", () => {
      expect(validatePattern("test*")).toEqual({ valid: true });
      expect(validatePattern("!test*")).toEqual({ valid: true });
      expect(validatePattern("")).toEqual({ valid: true });
    });

    test("should reject invalid patterns", () => {
      const result = validatePattern(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Pattern must be a string");
    });
  });
});
