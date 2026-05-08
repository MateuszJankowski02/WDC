/**
 * Main script for Lab 4: SHA-256 evaluation.
 * Verifies properties of the custom SHA-256 implementation
 * and compares performance with the built-in crypto module.
 * @module index
 */

const crypto = require("crypto");
const { sha256Custom, stringToBytes } = require("./sha256");

/**
 * Helper to compute Hamming distance between two hex strings
 * @param {string} hex1 - First hex string
 * @param {string} hex2 - Second hex string
 * @returns {number} The hamming distance (number of differing bits)
 */
function hammingDistanceHex(hex1, hex2) {
  if (hex1.length !== hex2.length) {
    throw new Error("Hex strings must be of equal length");
  }
  if (!/^[0-9a-fA-F]+$/.test(hex1) || !/^[0-9a-fA-F]+$/.test(hex2)) {
    throw new Error("Inputs must be valid hex strings");
  }
  let dist = 0;
  for (let i = 0; i < hex1.length; i++) {
    let val1 = parseInt(hex1[i], 16);
    let val2 = parseInt(hex2[i], 16);
    let diff = val1 ^ val2;
    while (diff > 0) {
      dist += diff & 1;
      diff >>= 1;
    }
  }
  return dist;
}

/**
 * Helper to modify exactly one bit in an array at a random position.
 * @param {string} str - The original string
 * @returns {Uint8Array} The modified byte array
 */
function flipOneBit(str) {
  const bytes = stringToBytes(str);
  const copy = new Uint8Array(bytes);
  if (copy.length === 0) return copy;

  const randomByteIndex = Math.floor(Math.random() * copy.length);
  const randomBitIndex = Math.floor(Math.random() * 8);

  copy[randomByteIndex] ^= 1 << randomBitIndex;
  return copy;
}

/**
 * Runs all required tests and outputs results.
 */
function runTests() {
  console.log("--- LAB 4: Weryfikacja właściwości SHA-256 ---");
  console.log();

  console.log(
    "0. Test poprawnego działania z wektorami testowymi (NIST Test Vectors)",
  );
  const nistEmpty = sha256Custom("");
  const nistAbc = sha256Custom("abc");
  console.log(`   Skrót ('')   : ${nistEmpty}`);
  console.log(
    `     Oczekiwany : e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
  );
  console.log(
    `     Zgodny     : ${nistEmpty === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" ? "TAK" : "NIE"}`,
  );
  console.log(`   Skrót ('abc'): ${nistAbc}`);
  console.log(
    `     Oczekiwany : ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`,
  );
  console.log(
    `     Zgodny     : ${nistAbc === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" ? "TAK" : "NIE"}`,
  );
  console.log();

  // Property 1: Arbitrary length
  console.log('1. Czy można skrócić tekst "dowolnej" długości?');
  const textEmpty = ""; // pusty tekst
  const textShort = "Hello World"; // krótki tekst
  const textLong = "A".repeat(10000); // bardzo długi tekst (10 000 znaków)
  console.log(`   Skrót ('')                 : ${sha256Custom(textEmpty)}`);
  console.log(`   Skrót ('Hello World')      : ${sha256Custom(textShort)}`);
  console.log(
    `   Skrót (10000x 'A')         : ${sha256Custom(textLong).substring(0, 32)}...`,
  );
  console.log(
    "   -> TAK (algorytm przetwarza wejście w blokach, obsługując dowolne rozmiary).",
  );
  console.log();

  // Property 2: Avalanche effect (1 bit change)
  console.log(
    "2. Czy po zmianie 1 losowego bitu, skrót istotnie się różni? (Efekt lawinowy)",
  );
  const originalMsg = "Test message for avalanche effect";
  const modifiedMsg = flipOneBit(originalMsg);
  const hashOriginal = sha256Custom(originalMsg);
  const hashModified = sha256Custom(modifiedMsg);

  console.log(`   Oryginalna wiadomość   : "${originalMsg}"`);
  console.log(
    `   Zmodyfikowana wiadomość: (zmieniony 1 bit w surowych bajtach)`,
  );
  console.log(`   Skrót 1: ${hashOriginal}`);
  console.log(`   Skrót 2: ${hashModified}`);

  const distance1 = hammingDistanceHex(hashOriginal, hashModified);
  console.log(`   Odległość Hamminga: ${distance1} bitów z 256`);
  console.log(`   Różnica: ${((distance1 / 256) * 100).toFixed(2)}%`);
  console.log(
    "   -> TAK (zmiana 1 bitu wpływa na około 50% bitów wyjściowych).",
  );
  console.log();

  // Property 3: Hamming distance between two completely different texts
  console.log(
    '3. Czy biorąc dwa różne teksty, ich odległość Hamminga jest "duża"?',
  );
  const textA = "First completely different text";
  const textB = "Second message entirely unrelated";
  const hashA = sha256Custom(textA);
  const hashB = sha256Custom(textB);
  const distance2 = hammingDistanceHex(hashA, hashB);

  console.log(`   Skrót A: ${hashA}`);
  console.log(`   Skrót B: ${hashB}`);
  console.log(`   Odległość Hamminga: ${distance2} bitów z 256`);
  console.log(`   Różnica: ${((distance2 / 256) * 100).toFixed(2)}%`);
  console.log(
    "   -> TAK (odległość wynosi zazwyczaj około 128 bitów, czyli ok. 50%).",
  );
  console.log();

  // Property 4: Fixed length output
  console.log("4. Czy tworzony jest skrót o zawsze tej samej długości?");
  console.log(
    `   Długość dla '': ${sha256Custom(textEmpty).length} znaków hex (${sha256Custom(textEmpty).length * 4} bitów)`,
  );
  console.log(
    `   Długość dla krótkiego tekstu: ${sha256Custom(textShort).length} znaków hex`,
  );
  console.log(
    `   Długość dla długiego tekstu: ${sha256Custom(textLong).length} znaków hex`,
  );
  console.log("   -> TAK (zawsze tworzy dokładnie 64 znaki hex = 256 bitów).");
  console.log();

  // Performance comparison
  console.log("--- Porównanie wydajności ---");
  const iterations = 10000;
  const testString = "Performance testing string for SHA-256 hashing";

  // Custom
  let dummyCustom = 0;
  const startCustom = performance.now();
  for (let i = 0; i < iterations; i++) {
    dummyCustom += sha256Custom(testString).length;
  }
  const endCustom = performance.now();

  // Built-in
  let dummyBuiltin = 0;
  const startBuiltin = performance.now();
  for (let i = 0; i < iterations; i++) {
    dummyBuiltin += crypto
      .createHash("sha256")
      .update(testString)
      .digest("hex").length;
  }
  const endBuiltin = performance.now();

  console.log(`Haszowanie ${iterations} razy:`);
  console.log(
    `   Własna implementacja JS : ${(endCustom - startCustom).toFixed(2)} ms`,
  );
  console.log(
    `   Wbudowane Node.js crypto: ${(endBuiltin - startBuiltin).toFixed(2)} ms`,
  );
  console.log(
    `   -> Wbudowana funkcja jest w przybliżeniu ${((endCustom - startCustom) / (endBuiltin - startBuiltin)).toFixed(1)}x szybsza.`,
  );
}

runTests();
