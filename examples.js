#!/usr/bin/env node

// Example usage of matcher-latest package
const {
  matcher,
  isMatch,
  fuzzyMatch,
  matchAdvanced,
  partialMatch,
  segmentMatch,
} = require("./dist/index.js");

console.log("🚀 matcher-latest - Example Usage\n");

// Basic matching
console.log("📁 Basic file filtering:");
const files = [
  "test.js",
  "test.ts",
  "README.md",
  "package.json",
  "script.min.js",
];
console.log("Files:", files);
console.log('Pattern: ["*.js", "*.ts"]');
console.log("Result:", matcher(files, ["*.js", "*.ts"]));

console.log("\n📝 Pattern with negation:");
console.log('Pattern: ["*", "!*.min.*"]');
console.log("Result:", matcher(files, ["*", "!*.min.*"]));

// isMatch examples
console.log("\n✅ isMatch examples:");
console.log('isMatch("unicorn", "uni*"):', isMatch("unicorn", "uni*"));
console.log('isMatch("rainbow", "!unicorn"):', isMatch("rainbow", "!unicorn"));
console.log('isMatch(["foo", "bar"], "f*"):', isMatch(["foo", "bar"], "f*"));

// Fuzzy matching
console.log("\n🔍 Fuzzy matching:");
const names = ["hello", "world", "help", "held"];
console.log("Names:", names);
console.log('Fuzzy match "helo" (threshold 0.7):');
const fuzzyResults = fuzzyMatch(names, "helo", 0.7);
fuzzyResults.forEach((result) => {
  console.log(`  "${result.input}" - score: ${result.score?.toFixed(2)}`);
});

// Advanced matching
console.log("\n⚡ Advanced matching with metadata:");
const advancedResults = matchAdvanced(["test.js", "app.tsx"], "*.js");
if (advancedResults[0]) {
  console.log("Match result:", {
    input: advancedResults[0].input,
    matched: advancedResults[0].matched,
    score: advancedResults[0].score,
    processingTime: advancedResults[0].metadata?.processingTime + "ms",
  });
}

// Partial matching
console.log("\n🔤 Partial matching:");
const sentences = ["hello world", "foo bar", "world peace"];
console.log("Sentences:", sentences);
console.log('Partial match "wor":', partialMatch(sentences, "wor"));

// Segment matching
console.log("\n🗂️ Segment matching:");
const paths = [
  "src/components/Button.tsx",
  "src/utils/helper.js",
  "tests/unit/test.js",
];
console.log("Paths:", paths);
console.log(
  'Segment match "src/*/Button.tsx" with separator "/":',
  segmentMatch(paths, "src/*/Button.tsx", "/")
);

console.log("\n✨ All examples completed!");
