const fs = require("fs");
const path = require("path");
const { blumBlumShub } = require("./helpers");

const readMessageFromFile = (filePath) => fs.readFileSync(filePath, "utf8");

const textToBits = (text) =>
  Array.from(Buffer.from(text, "utf8"), (byte) =>
    byte.toString(2).padStart(8, "0"),
  ).join("");

const bitsToText = (bits) => {
  if (bits.length % 8 !== 0) {
    throw new Error("Bit string length must be a multiple of 8.");
  }

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes).toString("utf8");
};

const xorBits = (leftBits, rightBits) => {
  if (leftBits.length !== rightBits.length) {
    throw new Error("Bit strings must have equal length.");
  }

  let result = "";
  for (let i = 0; i < leftBits.length; i += 1) {
    result += leftBits[i] === rightBits[i] ? "0" : "1";
  }

  return result;
};

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

const erfc = (x) => 1 - erf(x);

const nistMonobitTest = (bits) => {
  const n = bits.length;
  if (n === 0) {
    throw new Error("Bit string cannot be empty.");
  }

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

const nistRunsTest = (bits) => {
  const n = bits.length;
  if (n < 2) {
    throw new Error("Bit string must have at least 2 bits.");
  }

  const ones = bits.split("").filter((bit) => bit === "1").length;
  const pi = ones / n;
  const tau = 2 / Math.sqrt(n);

  if (Math.abs(pi - 0.5) >= tau) {
    return {
      testName: "NIST Runs",
      pValue: 0,
      pass: false,
      reason: "Frequency prerequisite not met",
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

const processPerfectCipher = (inputFilePath) => {
  const message = readMessageFromFile(inputFilePath);
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
