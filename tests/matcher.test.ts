import { matcher, isMatch, matchAdvanced, fuzzyMatch } from "../src/matcher";

describe("matcher", () => {
  describe("basic functionality", () => {
    test("should match with wildcard patterns", () => {
      expect(matcher(["foo", "bar", "baz"], ["*ar"])).toEqual(["bar"]);
      expect(matcher(["foo", "bar", "baz"], ["*a*"])).toEqual(["bar", "baz"]);
      expect(matcher(["foo", "bar", "baz"], ["f*"])).toEqual(["foo"]);
    });

    test("should handle negated patterns", () => {
      expect(matcher(["foo", "bar", "baz"], ["*", "!foo"])).toEqual([
        "bar",
        "baz",
      ]);
      expect(matcher(["foo", "bar", "baz"], ["*a*", "!bar"])).toEqual(["baz"]);
    });

    test("should handle empty inputs and patterns", () => {
      expect(matcher([], ["*"])).toEqual([]);
      expect(matcher(["foo"], [])).toEqual([]);
      expect(matcher([""], [""])).toEqual([""]);
    });

    test("should handle single string inputs", () => {
      expect(matcher("foo", ["f*"])).toEqual(["foo"]);
      expect(matcher("foo", "bar")).toEqual([]);
    });

    test("should handle complex patterns", () => {
      expect(matcher(["foo.js", "bar.ts", "baz.md"], ["*.js", "*.ts"])).toEqual(
        ["foo.js", "bar.ts"]
      );
    });
  });

  describe("options", () => {
    test("should handle case sensitivity", () => {
      expect(
        matcher(["Foo", "BAR"], ["foo"], { caseSensitive: false })
      ).toEqual(["Foo"]);
      expect(matcher(["Foo", "BAR"], ["foo"], { caseSensitive: true })).toEqual(
        []
      );
    });

    test("should handle allPatterns option", () => {
      expect(matcher(["foo", "bar"], ["*"], { allPatterns: true })).toEqual([
        "foo",
        "bar",
      ]);
      expect(
        matcher(["foo", "bar"], ["f*", "b*"], { allPatterns: true })
      ).toEqual([]);
    });
  });
});

describe("isMatch", () => {
  test("should return boolean for matches", () => {
    expect(isMatch("unicorn", "uni*")).toBe(true);
    expect(isMatch("unicorn", "*corn")).toBe(true);
    expect(isMatch("unicorn", "dragon")).toBe(false);
  });

  test("should handle array inputs", () => {
    expect(isMatch(["foo", "bar"], "f*")).toBe(true);
    expect(isMatch(["foo", "bar"], "baz")).toBe(false);
  });

  test("should handle negated patterns", () => {
    expect(isMatch("unicorn", "!dragon")).toBe(true);
    expect(isMatch("unicorn", "!unicorn")).toBe(false);
  });

  test("should handle empty patterns and inputs", () => {
    expect(isMatch("", "")).toBe(true);
    expect(isMatch("test", "")).toBe(false);
    expect(isMatch("", "test")).toBe(false);
    expect(isMatch([], [])).toBe(false);
  });
});

describe("matchAdvanced", () => {
  test("should return detailed match results", () => {
    const results = matchAdvanced(["foo", "bar"], ["f*"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      matched: true,
      input: "foo",
      pattern: "f*",
      score: 1,
    });
  });

  test("should include metadata", () => {
    const results = matchAdvanced(["test"], ["test"]);
    expect(results[0]?.metadata).toBeDefined();
    expect(results[0]?.metadata?.processingTime).toBeGreaterThanOrEqual(0);
  });
});

describe("fuzzyMatch", () => {
  test("should perform fuzzy matching", () => {
    const results = fuzzyMatch(["hello", "world"], "helo", 0.8);
    expect(results).toHaveLength(1);
    expect(results[0]?.input).toBe("hello");
    expect(results[0]?.score).toBeGreaterThanOrEqual(0.8);
  });

  test("should respect threshold", () => {
    const results = fuzzyMatch(["hello", "xyz"], "hello", 0.9);
    expect(results).toHaveLength(1);
    expect(results[0]?.input).toBe("hello");
  });
});
