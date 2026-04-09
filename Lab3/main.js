const path = require("path");
const {
  processRsaFromFile,
  demonstrateMessageAtLeastN,
} = require("./rsa");
const { benchmarkFactorization } = require("./factorization");

/**
 * Zamienia BigInt na krotsza reprezentacje szesnastkowa.
 * @param {bigint} value
 * @param {number} [maxChars=64]
 * @returns {string}
 */
const formatBigIntHex = (value, maxChars = 64) => {
  const hex = value.toString(16);
  if (hex.length <= maxChars) {
    return `0x${hex}`;
  }

  return `0x${hex.slice(0, maxChars)}...`;
};

/**
 * Tworzy tekstowa tabele wynikow faktoryzacji.
 * @param {Array<{bits: number, timeMs: number, iterations: number, success: boolean, method: string}>} rows
 * @returns {string}
 */
const buildFactorizationTable = (rows) => {
  const header = [
    "Rozmiar [bity]",
    "Metoda",
    "Czas [ms]",
    "Iteracje",
    "Sukces",
  ];

  const body = rows.map((entry) => [
    String(entry.bits),
    entry.method,
    entry.timeMs.toFixed(3),
    String(entry.iterations),
    entry.success ? "TAK" : "NIE",
  ]);

  const allRows = [header, ...body];
  const widths = header.map((_, col) =>
    Math.max(...allRows.map((row) => row[col].length)),
  );

  return allRows
    .map((row, idx) => {
      const line = row
        .map((cell, col) => cell.padEnd(widths[col], " "))
        .join(" | ");
      if (idx === 0) {
        const separator = widths.map((width) => "-".repeat(width)).join("-|-");
        return `${line}\n${separator}`;
      }
      return line;
    })
    .join("\n");
};

/**
 * Uruchamia pelny Lab3: RSA + benchmark faktoryzacji.
 * @returns {void}
 */
const main = () => {
  const inputPath = path.join(__dirname, "example.txt");

  const rsaResult = processRsaFromFile(inputPath, {
    blockSize: 10,
    keyBits: 768,
    publicExponent: 65537n,
  });

  console.log("=== RSA: szyfrowanie i odszyfrowanie ===");
  console.log(`Dlugosc klucza n [bity]: ${rsaResult.keySizeBits}`);
  console.log(`Liczba blokow: ${rsaResult.blocks.length}`);
  console.log(`Pierwszy blok jawny: ${JSON.stringify(rsaResult.blocks[0] || "")}`);
  if (rsaResult.encodedBlocks.length > 0) {
    console.log(`Pierwszy blok jako liczba m: ${rsaResult.encodedBlocks[0].toString()}`);
    console.log(
      `Pierwszy blok szyfrogramu c: ${formatBigIntHex(rsaResult.encryptedBlocks[0])}`,
    );
  }
  console.log(`Zgodnosc blok po bloku: ${rsaResult.blockChecks.every((entry) => entry.match)}`);
  console.log(`Zgodnosc calosci: ${rsaResult.isValid}`);

  const invalidDemo = demonstrateMessageAtLeastN(
    rsaResult.publicKey,
    rsaResult.privateKey,
  );
  console.log("\n=== Demonstracja przypadku m >= n ===");
  console.log(`m: ${invalidDemo.m.toString()}`);
  console.log(`n: ${invalidDemo.n.toString()}`);
  console.log(`m mod n: ${invalidDemo.reduced.toString()}`);
  console.log(`Odszyfrowane: ${invalidDemo.decrypted.toString()}`);
  console.log(`Czy odszyfrowanie zwrocilo oryginalne m: ${invalidDemo.equalToOriginal}`);

  console.log("\n=== Faktoryzacja RSA (benchmark) ===");
  const benchmark = benchmarkFactorization([32, 40, 48, 56, 64, 72, 80, 88]);
  console.log(
    buildFactorizationTable(
      benchmark.results.map((entry) => ({
        bits: entry.bits,
        method: entry.method,
        timeMs: entry.timeMs,
        iterations: entry.iterations,
        success: entry.success,
      })),
    ),
  );

  console.log("\nDopasowane modele:");
  benchmark.fit.models.forEach((model) => {
    console.log(`- ${model.name}: R^2=${model.r2.toFixed(6)} | ${model.equation}`);
  });
  console.log(`Najlepszy model: ${benchmark.fit.bestModel.name}`);

  console.log("\nEkstrapolacja (najlepszy model):");
  benchmark.extrapolation.forEach((entry) => {
    console.log(`- ${entry.bits} bit: ${entry.predictedMs.toFixed(3)} ms`);
  });
};

if (require.main === module) {
  main();
}

module.exports = {
  buildFactorizationTable,
  formatBigIntHex,
  main,
};
