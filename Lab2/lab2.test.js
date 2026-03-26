const path = require("path");
const fs = require("fs");
const {
  textToBits,
  bitsToText,
  xorBits,
  nistMonobitTest,
  nistRunsTest,
  processPerfectCipher,
} = require("./main");
const { blumBlumShub } = require("./helpers");

describe("Konwersja tekst <-> bity", () => {
  it("poprawnie konwertuje i odtwarza tekst UTF-8", () => {
    const text = "Zażółć gęślą jaźń";
    const bits = textToBits(text);
    const restored = bitsToText(bits);

    expect(bits.length % 8).toBe(0);
    expect(restored).toBe(text);
  });

  it("zgłasza błąd dla niebinarnego ciągu", () => {
    expect(() => bitsToText("01012")).toThrow(
      "Ciąg bitów może zawierać tylko znaki 0 i 1.",
    );
  });

  it("zgłasza błąd dla długości niebędącej wielokrotnością 8", () => {
    expect(() => bitsToText("101")).toThrow(
      "Długość ciągu bitów musi być wielokrotnością 8.",
    );
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

  it("zgłasza błąd dla ciągów o różnej długości", () => {
    expect(() => xorBits("1010", "10")).toThrow(
      "Porównywane ciągi bitów muszą mieć tę samą długość.",
    );
  });
});

describe("Generator Blum-Blum-Shub", () => {
  it("zwraca ciąg o żądanej długości złożony wyłącznie z 0/1", () => {
    const bits = blumBlumShub(256);

    expect(bits).toHaveLength(256);
    expect(bits).toMatch(/^[01]+$/);
  });

  it("zwraca pusty ciąg dla 0 bitów", () => {
    expect(blumBlumShub(0)).toBe("");
  });

  it("zgłasza błąd dla ujemnej długości", () => {
    expect(() => blumBlumShub(-1)).toThrow(
      "bitCount musi być nieujemną liczbą całkowitą.",
    );
  });

  it("zgłasza błąd dla niecałkowitej długości", () => {
    expect(() => blumBlumShub(12.5)).toThrow(
      "bitCount musi być nieujemną liczbą całkowitą.",
    );
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

  it("zgłaszają błąd dla niepoprawnych danych wejściowych", () => {
    expect(() => nistMonobitTest("abc")).toThrow(
      "Ciąg bitów może zawierać tylko znaki 0 i 1.",
    );
    expect(() => nistRunsTest("1")).toThrow(
      "Ciąg bitów musi mieć co najmniej 2 bity.",
    );
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

  it("zgłasza czytelny błąd dla pustego pliku", () => {
    const tempPath = path.join(__dirname, "__empty_test_input__.txt");
    fs.writeFileSync(tempPath, "", "utf8");

    try {
      expect(() => processPerfectCipher(tempPath)).toThrow(
        "Wiadomość wejściowa jest pusta.",
      );
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  });
});
