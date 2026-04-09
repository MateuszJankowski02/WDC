const fs = require("fs");
const path = require("path");
const {
  gcd,
  generateRsaKeyPair,
  splitIntoBlocks,
  encodeBlockToNumber,
  decodeNumberToBlock,
  encryptBlock,
  decryptBlock,
  processRsaFromFile,
  demonstrateMessageAtLeastN,
} = require("./rsa");
const {
  factorSemiprime,
  fitModels,
  benchmarkFactorization,
} = require("./factorization");

describe("Kodowanie i dzielenie blokow", () => {
  it("dzieli tekst na bloki po 10 znakow", () => {
    const blocks = splitIntoBlocks("ABCDEFGHIJKL", 10);
    expect(blocks).toEqual(["ABCDEFGHIJ", "KL"]);
  });

  it("koduje i dekoduje blok odwracalnie", () => {
    const original = "HELLO-123";
    const encoded = encodeBlockToNumber(original, 10);
    const decoded = decodeNumberToBlock(encoded, 10);

    expect(decoded).toBe(original);
  });

  it("odrzuca znaki spoza ASCII", () => {
    expect(() => encodeBlockToNumber("Zażółć", 10)).toThrow(
      "Wiadomosc musi zawierac tylko znaki ASCII (0-127).",
    );
  });
});

describe("Klucze i operacje RSA", () => {
  it("generuje poprawna pare kluczy", () => {
    const { publicKey, privateKey, internals } = generateRsaKeyPair(64, 65537n);

    expect(publicKey.n).toBeGreaterThan(0n);
    expect(publicKey.e).toBe(65537n);
    expect(privateKey.d).toBeGreaterThan(0n);
    expect(gcd(publicKey.e, internals.phi)).toBe(1n);
  });

  it("szyfruje i odszyfrowuje pojedynczy blok", () => {
    const { publicKey, privateKey } = generateRsaKeyPair(64, 65537n);
    const m = encodeBlockToNumber("TEST", 4);

    const c = encryptBlock(m, publicKey);
    const restored = decryptBlock(c, privateKey);

    expect(restored).toBe(m);
    expect(decodeNumberToBlock(restored, 4)).toBe("TEST");
  });

  it("daje identyczny szyfrogram dla identycznych blokow", () => {
    const { publicKey } = generateRsaKeyPair(64, 65537n);
    const block = encodeBlockToNumber("ABCD", 4);

    const c1 = encryptBlock(block, publicKey);
    const c2 = encryptBlock(block, publicKey);

    expect(c1).toBe(c2);
  });

  it("odrzuca szyfrowanie bloku m >= n", () => {
    const { publicKey } = generateRsaKeyPair(64, 65537n);
    expect(() => encryptBlock(publicKey.n, publicKey)).toThrow(
      "Wartosc bloku m musi spelniac warunek 0 <= m < n.",
    );
  });

  it("pokazuje redukcje modulo n dla przypadku m >= n", () => {
    const { publicKey, privateKey } = generateRsaKeyPair(64, 65537n);
    const demo = demonstrateMessageAtLeastN(publicKey, privateKey);

    expect(demo.m).toBeGreaterThanOrEqual(demo.n);
    expect(demo.decrypted).toBe(demo.reduced);
    expect(demo.equalToOriginal).toBe(false);
  });
});

describe("Pelny pipeline RSA z pliku", () => {
  it("szyfruje i odszyfrowuje wszystkie bloki poprawnie", () => {
    const tempFile = path.join(__dirname, "__lab3_temp_input__.txt");
    fs.writeFileSync(
      tempFile,
      "BLOCK-1234 BLOCK-1234 BLOCK-1234",
      "utf8",
    );

    try {
      const result = processRsaFromFile(tempFile, {
        blockSize: 10,
        keyBits: 96,
        publicExponent: 65537n,
      });

      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.isValid).toBe(true);
      result.blockChecks.forEach((entry) => {
        expect(entry.match).toBe(true);
      });
      expect(result.decryptedMessage).toBe(result.message);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});

describe("Faktoryzacja i dopasowanie modeli", () => {
  it("faktoryzuje semiprime wygenerowane z malego klucza", () => {
    const { publicKey } = generateRsaKeyPair(32, 65537n);
    const factorization = factorSemiprime(publicKey.n);

    expect(factorization.success).toBe(true);
    expect(factorization.p).not.toBeNull();
    expect(factorization.q).not.toBeNull();
    expect(factorization.p * factorization.q).toBe(publicKey.n);
  });

  it("dopasowuje modele i wybiera najlepszy po R^2", () => {
    const fit = fitModels([
      { bits: 32, timeMs: 0.8 },
      { bits: 40, timeMs: 1.9 },
      { bits: 48, timeMs: 4.5 },
      { bits: 56, timeMs: 9.7 },
    ]);

    expect(fit.models).toHaveLength(3);
    expect(fit.models[0].r2).toBeGreaterThanOrEqual(fit.models[1].r2);
    expect(fit.models[1].r2).toBeGreaterThanOrEqual(fit.models[2].r2);
    expect(typeof fit.bestModel.equation).toBe("string");
  });

  it("uruchamia skrocony benchmark faktoryzacji", () => {
    const benchmark = benchmarkFactorization([32, 40]);

    expect(benchmark.results).toHaveLength(2);
    benchmark.results.forEach((row) => {
      expect(row.bits).toBeGreaterThanOrEqual(32);
      expect(row.timeMs).toBeGreaterThanOrEqual(0);
      expect(typeof row.iterations).toBe("number");
    });
    expect(benchmark.fit.models).toHaveLength(3);
    expect(benchmark.extrapolation).toHaveLength(3);
  });
});
