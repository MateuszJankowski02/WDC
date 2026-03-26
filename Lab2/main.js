const fs = require("fs");
const path = require("path");
const { blumBlumShub } = require("./helpers");

/**
 * Wczytuje zawartość pliku tekstowego jako UTF-8.
 * @param {string} filePath Ścieżka do pliku wejściowego.
 * @returns {string} Treść pliku.
 */
const readMessageFromFile = (filePath) => fs.readFileSync(filePath, "utf8");

/**
 * Zamienia tekst UTF-8 na ciąg bitów.
 * @param {string} text Tekst wejściowy.
 * @returns {string} Ciąg bitów (0/1) o długości wielokrotności 8.
 */
const textToBits = (text) =>
  Array.from(Buffer.from(text, "utf8"), (byte) =>
    byte.toString(2).padStart(8, "0"),
  ).join("");

/**
 * Zamienia ciąg bitów na tekst UTF-8.
 * @param {string} bits Ciąg bitów (0/1).
 * @returns {string} Odtworzony tekst.
 * @throws {Error} Gdy ciąg zawiera znaki inne niż 0/1.
 * @throws {Error} Gdy długość ciągu nie jest wielokrotnością 8.
 */
const bitsToText = (bits) => {
  if (!/^[01]*$/.test(bits)) {
    throw new Error("Ciąg bitów może zawierać tylko znaki 0 i 1.");
  }

  if (bits.length % 8 !== 0) {
    throw new Error("Długość ciągu bitów musi być wielokrotnością 8.");
  }

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes).toString("utf8");
};

/**
 * Sprawdza poprawność binarnego ciągu znaków i minimalną długość.
 * @param {string} bits Ciąg bitów do walidacji.
 * @param {number} [minLength=0] Wymagana minimalna liczba bitów.
 * @returns {void}
 * @throws {Error} Gdy wejście nie jest poprawnym ciągiem bitów.
 */
const assertBitString = (bits, minLength = 0) => {
  if (!/^[01]+$/.test(bits)) {
    throw new Error("Ciąg bitów może zawierać tylko znaki 0 i 1.");
  }

  if (bits.length < minLength) {
    throw new Error(`Ciąg bitów musi mieć co najmniej ${minLength} bity.`);
  }
};

/**
 * Wykonuje XOR dwóch ciągów bitów o tej samej długości.
 * @param {string} leftBits Pierwszy operand.
 * @param {string} rightBits Drugi operand.
 * @returns {string} Wynik operacji XOR.
 * @throws {Error} Gdy wejścia nie są poprawnymi ciągami bitów lub mają różne długości.
 */
const xorBits = (leftBits, rightBits) => {
  assertBitString(leftBits, 1);
  assertBitString(rightBits, 1);

  if (leftBits.length !== rightBits.length) {
    throw new Error("Porównywane ciągi bitów muszą mieć tę samą długość.");
  }

  let result = "";
  for (let i = 0; i < leftBits.length; i += 1) {
    result += leftBits[i] === rightBits[i] ? "0" : "1";
  }

  return result;
};

/**
 * Aproksymuje funkcję błędu Gaussa erf(x).
 * @param {number} x Argument funkcji.
 * @returns {number} Przybliżona wartość erf(x).
 */
const erf = (x) => {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
};

/**
 * Oblicza dopełnienie funkcji błędu: erfc(x) = 1 - erf(x).
 * @param {number} x Argument funkcji.
 * @returns {number} Wartość erfc(x).
 */
const erfc = (x) => 1 - erf(x);

/**
 * Wykonuje test NIST Frequency (Monobit).
 * Ten test sprawdza, czy liczba zer i jedynek jest zbliżona do siebie,
 * czyli czy generator nie ma prostego, systematycznego przechyłu w jedną stronę.
 * To podstawowy „filtr jakości” przed dalszą analizą losowości klucza.
 * Interpretacja w tym projekcie: `pValue >= 0.01` oznacza brak podstaw,
 * aby odrzucić hipotezę o losowym zachowaniu sekwencji w tym teście (`pass=true`).
 * `pass=false` nie dowodzi „nielosowości absolutnej”, ale sygnalizuje,
 * że klucz może być słaby i warto go odrzucić lub przebadać dalej.
 * @param {string} bits Ciąg bitów do testu.
 * @returns {{testName: string, pValue: number, pass: boolean}} Wynik testu statystycznego.
 */
const nistMonobitTest = (bits) => {
  assertBitString(bits, 1);
  const n = bits.length;

  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += bits[i] === "1" ? 1 : -1;
  }

  const sObs = Math.abs(sum) / Math.sqrt(n);
  const pValue = erfc(sObs / Math.sqrt(2));

  return {
    testName: "NIST Frequency (Monobit)",
    pValue,
    pass: pValue >= 0.01,
  };
};

/**
 * Wykonuje test NIST Runs.
 * Test bada, czy przejścia między 0 i 1 występują z rozsądną częstotliwością.
 * Dzięki temu wykrywa zbyt długie „serie” tego samego bitu, które mogą sugerować,
 * że sekwencja wygląda na uporządkowaną, a nie losową.
 * Interpretacja wyniku jest taka sama: `pValue >= 0.01` traktujemy jako zaliczenie.
 * Warto pamiętać, że pojedynczy test nie „potwierdza” pełnej losowości,
 * a jedynie odfiltrowuje część oczywistych anomalii.
 * @param {string} bits Ciąg bitów do testu.
 * @returns {{testName: string, pValue: number, pass: boolean, reason?: string}} Wynik testu statystycznego.
 */
const nistRunsTest = (bits) => {
  assertBitString(bits, 2);
  const n = bits.length;

  let ones = 0;
  for (let i = 0; i < n; i += 1) {
    if (bits[i] === "1") {
      ones += 1;
    }
  }
  const pi = ones / n;
  const tau = 2 / Math.sqrt(n);

  if (Math.abs(pi - 0.5) >= tau) {
    return {
      testName: "NIST Runs",
      pValue: 0,
      pass: false,
      reason: "Warunek wstępny testu częstotliwości nie został spełniony",
    };
  }

  let runs = 1;
  for (let i = 1; i < n; i += 1) {
    if (bits[i] !== bits[i - 1]) {
      runs += 1;
    }
  }

  const numerator = Math.abs(runs - 2 * n * pi * (1 - pi));
  const denominator = 2 * Math.sqrt(2 * n) * pi * (1 - pi);
  const pValue = erfc(numerator / denominator);

  return {
    testName: "NIST Runs",
    pValue,
    pass: pValue >= 0.01,
  };
};

/**
 * Realizuje pełny przepływ szyfru doskonałego (one-time pad):
 * wczytanie wiadomości, konwersja na bity, generacja klucza BBS,
 * testy losowości, szyfrowanie XOR, odszyfrowanie i walidacja zgodności.
 * Celem pipeline'u jest nie tylko zaszyfrowanie danych, ale też pokazanie,
 * że jakość klucza ma krytyczne znaczenie: nawet poprawny algorytm XOR
 * traci wartość, gdy klucz nie zachowuje się wystarczająco losowo.
 * Dlatego raport `randomnessReport` powinien być czytany jako decyzja wejściowa:
 * jeśli testy regularnie nie przechodzą, należy poprawić generator/parametry,
 * zamiast polegać wyłącznie na tym, że odszyfrowanie technicznie „działa”.
 * @param {string} inputFilePath Ścieżka do pliku z wiadomością.
 * @returns {{
 *  message: string,
 *  plainBits: string,
 *  keyBits: string,
 *  randomnessReport: Array<{testName: string, pValue: number, pass: boolean, reason?: string}>,
 *  cipherBits: string,
 *  decryptedBits: string,
 *  decryptedMessage: string,
 *  isValid: boolean
 * }} Wynik całego procesu szyfrowania i odszyfrowania.
 * @throws {Error} Gdy wiadomość wejściowa jest pusta.
 */
const processPerfectCipher = (inputFilePath) => {
  const message = readMessageFromFile(inputFilePath);
  if (message.length === 0) {
    throw new Error("Wiadomość wejściowa jest pusta.");
  }

  const plainBits = textToBits(message);
  const keyBits = blumBlumShub(plainBits.length);
  const randomnessReport = [nistMonobitTest(keyBits), nistRunsTest(keyBits)];

  const cipherBits = xorBits(plainBits, keyBits);
  const decryptedBits = xorBits(cipherBits, keyBits);
  const decryptedMessage = bitsToText(decryptedBits);

  return {
    message,
    plainBits,
    keyBits,
    randomnessReport,
    cipherBits,
    decryptedBits,
    decryptedMessage,
    isValid: message === decryptedMessage,
  };
};

/**
 * Uruchamia demonstrację działania zadania na pliku `example.txt`.
 * @returns {void}
 */
const main = () => {
  const inputPath = path.join(__dirname, "example.txt");
  const result = processPerfectCipher(inputPath);

  console.log(`Wczytano znaków: ${result.message.length}`);
  console.log(`Długość wiadomości [bity]: ${result.plainBits.length}`);
  console.log(`Długość klucza [bity]: ${result.keyBits.length}`);
  result.randomnessReport.forEach((report) => {
    console.log(
      `${report.testName}: pass=${report.pass}, p-value=${report.pValue.toFixed(6)}`,
    );
  });
  console.log(`Zgodność po odszyfrowaniu: ${result.isValid}`);
};

if (require.main === module) {
  main();
}

module.exports = {
  readMessageFromFile,
  textToBits,
  bitsToText,
  xorBits,
  nistMonobitTest,
  nistRunsTest,
  processPerfectCipher,
  main,
};
