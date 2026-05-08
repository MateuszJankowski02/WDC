# Agent Memory Lab 4

## 1. Task goal and acceptance criteria
- Implement SHA-256 hash function in JavaScript (JSDoc required, output readable).
- Verify hash function properties:
  1. Hash text of "any" length.
  2. Test avalanche effect: Changing 1 random bit significantly changes the hash.
  3. Compare Hamming distance between two different texts.
  4. Ensure hash is always the same length.
- Compare performance of custom implementation vs. library function (e.g. `crypto.createHash('sha256')`).
- After completing, use subagents to review the code.

## 2. Relevant files and current code state
- `Lab4/Lab 4.pdf` (source PDF)
- `Lab4/Lab 4.txt` (converted text)
- `Lab4/index.js` (to be created, containing implementation and properties check)
- `.github/agent_memory_lab4.md` (this file)

## 3. Source materials
- `Lab4/Lab 4.txt` content: Implement SHA 256, verify properties (arbitrary length, avalanche effect, hamming distance, fixed length hash output). Compare single hash generation time against standard library.

## 4. Constraints and assumptions
- Language: Node.js / JavaScript.
- Code must have JSDoc documentation.
- Program output must be easy to read.

## 5. Iteration notes and next actions
- [x] Setup SHA-256 implementation (custom).
- [x] Setup tests for Properties 1-4.
- [x] Setup performance comparison with standard Node `crypto` library.
- [x] Review with subagents.

*Update: Implemented SHA-256 in JS. Reviewed with subagent `reviewer`. Fixed UTF-8 string decoding bug for bit-flip tests, updated JSDoc for `rotr` and `padMessage`, added NIST test vectors to ensure hash correctness, and updated performance benchmarking loop to prevent V8 JIT elimination.*
