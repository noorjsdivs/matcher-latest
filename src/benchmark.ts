import { matcher, isMatch, fuzzyMatch, matchAdvanced } from "./matcher";

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  operationsPerSecond: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 10000
): BenchmarkResult {
  // Warm up
  for (let i = 0; i < 100; i++) {
    fn();
  }

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / iterations;
  const operationsPerSecond = Math.round(iterations / (totalTime / 1000));

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    operationsPerSecond,
  };
}

function printResult(result: BenchmarkResult): void {
  console.log(`\n${result.name}:`);
  console.log(`  Iterations: ${result.iterations.toLocaleString()}`);
  console.log(`  Total time: ${result.totalTime}ms`);
  console.log(`  Average time: ${result.averageTime.toFixed(4)}ms`);
  console.log(
    `  Operations/sec: ${result.operationsPerSecond.toLocaleString()}`
  );
}

// Test data
const testInputs = [
  "test.js",
  "test.ts",
  "index.html",
  "style.css",
  "script.min.js",
  "component.vue",
  "config.json",
  "readme.md",
  "package.json",
  "main.go",
];

const testPatterns = ["*.js", "*.ts", "test*", "!*.min.*"];

console.log("Running matcher-latest benchmarks...\n");

// Basic matcher benchmarks
const basicResult = benchmark(
  "Basic matcher",
  () => {
    matcher(testInputs, testPatterns);
  },
  50000
);
printResult(basicResult);

const isMatchResult = benchmark(
  "isMatch",
  () => {
    isMatch(testInputs[0]!, testPatterns[0]!);
  },
  100000
);
printResult(isMatchResult);

const wildcardResult = benchmark(
  "Wildcard patterns",
  () => {
    matcher(testInputs, ["*test*", "*script*", "!*.min.*"]);
  },
  30000
);
printResult(wildcardResult);

const caseInsensitiveResult = benchmark(
  "Case insensitive matching",
  () => {
    matcher(
      testInputs.map((s) => s.toUpperCase()),
      testPatterns,
      { caseSensitive: false }
    );
  },
  30000
);
printResult(caseInsensitiveResult);

const fuzzyMatchResult = benchmark(
  "Fuzzy matching",
  () => {
    fuzzyMatch(testInputs, "test", 0.6);
  },
  10000
);
printResult(fuzzyMatchResult);

const advancedResult = benchmark(
  "Advanced matching",
  () => {
    matchAdvanced(testInputs, testPatterns);
  },
  20000
);
printResult(advancedResult);

// Memory usage benchmark
const memoryBefore = process.memoryUsage();
const largeInputs = Array(10000)
  .fill(null)
  .map((_, i) => `file-${i}.js`);
const largePatterns = ["*.js", "!*test*", "*-*"];

benchmark(
  "Large dataset",
  () => {
    matcher(largeInputs, largePatterns);
  },
  100
);

const memoryAfter = process.memoryUsage();

console.log("\nMemory usage:");
console.log(
  `  Heap used: ${
    Math.round(
      ((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024) * 100
    ) / 100
  }MB`
);
console.log(
  `  External: ${
    Math.round(
      ((memoryAfter.external - memoryBefore.external) / 1024 / 1024) * 100
    ) / 100
  }MB`
);

console.log("\nBenchmark completed!");
