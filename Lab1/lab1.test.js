const path = require("path");
const {
  textToBits,
  bitsToText,
  xorBits,
  nistMonobitTest,
  nistRunsTest,
  processPerfectCipher,
} = require("./main");

describe("Konwersja tekst <-> bity", () => {
  it("poprawnie konwertuje i odtwarza tekst UTF-8", () => {
    const text = "Zażółć gęślą jaźń";
    const bits = textToBits(text);
    const restored = bitsToText(bits);

    expect(bits.length % 8).toBe(0);
    expect(restored).toBe(text);
  });
});

describe("Szyfrowanie XOR", () => {
  it("odszyfrowuje wiadomość tym samym kluczem", () => {
    const messageBits = "10110010";
    const keyBits = "01011100";

    const cipherBits = xorBits(messageBits, keyBits);
    const decryptedBits = xorBits(cipherBits, keyBits);

    expect(decryptedBits).toBe(messageBits);
  });
});

describe("Testy statystyczne NIST", () => {
  it("odrzucają oczywiście nielosowy ciąg", () => {
    const nonRandom = "0".repeat(256);
    const monobit = nistMonobitTest(nonRandom);
    const runs = nistRunsTest(nonRandom);

    expect(monobit.pass).toBe(false);
    expect(runs.pass).toBe(false);
  });
});

describe("Pełny przepływ szyfru doskonałego", () => {
  it("realizuje kroki: wczytanie, klucz BBS, testy, szyfrowanie i odszyfrowanie", () => {
    const inputPath = path.join(__dirname, "example.txt");
    const result = processPerfectCipher(inputPath);

    expect(result.message.length).toBeGreaterThan(0);
    expect(result.plainBits).toMatch(/^[01]+$/);
    expect(result.keyBits).toMatch(/^[01]+$/);
    expect(result.keyBits).toHaveLength(result.plainBits.length);

    expect(result.randomnessReport).toHaveLength(2);
    result.randomnessReport.forEach((report) => {
      expect(typeof report.pass).toBe("boolean");
      expect(report.pValue).toBeGreaterThanOrEqual(0);
      expect(report.pValue).toBeLessThanOrEqual(1);
    });

    expect(result.cipherBits).toHaveLength(result.plainBits.length);
    expect(result.decryptedMessage).toBe(result.message);
    expect(result.isValid).toBe(true);
  });
});
