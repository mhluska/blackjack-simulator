import Simulator from '../src/simulator';

const HANDS = 5_000_000;
const MIN_HANDS_PER_SEC = 1_000_000; // absolute floor sanity check

// Run a reference workload (pure arithmetic) to normalize for machine speed
function referenceWorkload(): number {
  const iterations = 50_000_000;
  const start = performance.now();
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.floor(Math.random() * 52);
  }
  const elapsed = (performance.now() - start) / 1000;
  // Prevent dead code elimination
  if (sum === -1) console.log(sum);
  return iterations / elapsed;
}

// Run the simulator workload
function simulatorWorkload(): number {
  const sim = new Simulator({ hands: HANDS });
  const start = performance.now();
  sim.run();
  const elapsed = (performance.now() - start) / 1000;
  return HANDS / elapsed;
}

// The ratio of simulator throughput to reference throughput should be stable
// across machines. We measure it and assert it doesn't drop below a threshold.
const refOps = referenceWorkload();
const simOps = simulatorWorkload();
const ratio = simOps / refOps;

console.log(`Reference: ${(refOps / 1e6).toFixed(1)}M ops/sec`);
console.log(`Simulator: ${(simOps / 1e6).toFixed(1)}M hands/sec`);
console.log(`Ratio: ${ratio.toFixed(4)}`);

// Sanity check: absolute floor
if (simOps < MIN_HANDS_PER_SEC) {
  console.error(
    `FAIL: Simulator throughput ${(simOps / 1e6).toFixed(1)}M hands/sec is below absolute minimum ${MIN_HANDS_PER_SEC / 1e6}M`,
  );
  process.exit(1);
}

// The ratio should be roughly stable. Set a generous floor.
// Measure this on your machine and set EXPECTED_RATIO accordingly.
// A >20% drop from the expected ratio indicates a regression.
const EXPECTED_RATIO = 0.011; // Measured ratio of simulator throughput to reference throughput
const THRESHOLD = 0.8; // Allow 20% degradation

if (EXPECTED_RATIO > 0 && ratio < EXPECTED_RATIO * THRESHOLD) {
  console.error(
    `FAIL: Performance regression detected. Ratio ${ratio.toFixed(4)} is below threshold ${(EXPECTED_RATIO * THRESHOLD).toFixed(4)}`,
  );
  process.exit(1);
}

console.log('PASS: Performance is within acceptable range');
