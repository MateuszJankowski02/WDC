const crypto = require("crypto");
const fs = require("fs");

/**
 * Oblicza dlugosc bitowa liczby BigInt.
 * @param {bigint} value
 * @returns {number}
 */
const bitLength = (value) => {
  if (value < 0n) {
    throw new Error("bitLength oczekuje liczby nieujemnej.");
  }

  return value === 0n ? 0 : value.toString(2).length;
};

/**
 * Oblicza najwiekszy wspolny dzielnik dla BigInt.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
const gcd = (a, b) => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;

  while (y !== 0n) {
    [x, y] = [y, x % y];
  }

  return x;
};

/**
 * Rozszerzony algorytm Euklidesa.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {{gcd: bigint, x: bigint, y: bigint}}
 */
const extendedGcd = (a, b) => {
  if (b === 0n) {
    return { gcd: a, x: 1n, y: 0n };
  }

  const next = extendedGcd(b, a % b);
  return {
    gcd: next.gcd,
    x: next.y,
    y: next.x - (a / b) * next.y,
  };
};

/**
 * Liczy odwrotnosc modularna liczby a modulo m.
 * @param {bigint} a
 * @param {bigint} m
 * @returns {bigint}
 */
const modInverse = (a, m) => {
  const result = extendedGcd(a, m);
  if (result.gcd !== 1n) {
    throw new Error("Odwrotnosc modularna nie istnieje.");
  }

  return ((result.x % m) + m) % m;
};

/**
 * Szybkie potegowanie modularne.
 * @param {bigint} base
 * @param {bigint} exponent
 * @param {bigint} modulus
 * @returns {bigint}
 */
const modPow = (base, exponent, modulus) => {
  if (modulus <= 0n) {
    throw new Error("Modul musi byc dodatni.");
  }

  let result = 1n;
  let b = ((base % modulus) + modulus) % modulus;
  let e = exponent;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % modulus;
    }
    b = (b * b) % modulus;
    e >>= 1n;
  }

  return result;
};

/**
 * Losuje BigInt z zakresu [min, max].
 * @param {bigint} min
 * @param {bigint} max
 * @returns {bigint}
 */
const randomBigIntInRange = (min, max) => {
  if (min > max) {
    throw new Error("Niepoprawny zakres losowania BigInt.");
  }

  const range = max - min + 1n;
  const bits = bitLength(range);
  const bytes = Math.ceil(bits / 8);
  const mask = (1n << BigInt(bits)) - 1n;

  while (true) {
    const randomBytes = crypto.randomBytes(bytes);
    const randomValue = BigInt(`0x${randomBytes.toString("hex")}`) & mask;

    if (randomValue < range) {
      return min + randomValue;
    }
  }
};

/**
 * Losuje nieparzysta liczbe o zadanej liczbie bitow.
 * @param {number} bits
 * @returns {bigint}
 */
const randomOddBigInt = (bits) => {
  if (!Number.isInteger(bits) || bits < 2) {
    throw new Error("Liczba bitow musi byc calkowita i >= 2.");
  }

  const bytes = Math.ceil(bits / 8);
  const raw = crypto.randomBytes(bytes);
  let value = BigInt(`0x${raw.toString("hex")}`);

  const extraBits = bytes * 8 - bits;
  if (extraBits > 0) {
    const maxValue = (1n << BigInt(bits)) - 1n;
    value &= maxValue;
  }

  value |= 1n;
  value |= 1n << BigInt(bits - 1);

  return value;
};

/**
 * Probabilistyczny test pierwszosci Miller-Rabin.
 * @param {bigint} n
 * @param {number} rounds
 * @returns {boolean}
 */
const isProbablePrime = (n, rounds = 32) => {
  if (n < 2n) {
    return false;
  }

  const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const prime of smallPrimes) {
    if (n === prime) {
      return true;
    }
    if (n % prime === 0n) {
      return false;
    }
  }

  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }

  for (let i = 0; i < rounds; i += 1) {
    const a = randomBigIntInRange(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) {
      continue;
    }

    let witnessComposite = true;
    for (let r = 1; r < s; r += 1) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        witnessComposite = false;
        break;
      }
    }

    if (witnessComposite) {
      return false;
    }
  }

  return true;
};

/**
 * Generuje liczbe pierwsza o zadanej liczbie bitow.
 * @param {number} bits
 * @returns {bigint}
 */
const generatePrime = (bits) => {
  while (true) {
    const candidate = randomOddBigInt(bits);
    if (isProbablePrime(candidate)) {
      return candidate;
    }
  }
};

/**
 * Generuje pare kluczy RSA o zadanej dlugosci n.
 * @param {number} keyBits
 * @param {bigint} publicExponent
 * @returns {{publicKey: {n: bigint, e: bigint}, privateKey: {n: bigint, d: bigint}, internals: {p: bigint, q: bigint, phi: bigint, keyBits: number}}}
 */
const generateRsaKeyPair = (keyBits = 768, publicExponent = 65537n) => {
  if (!Number.isInteger(keyBits) || keyBits < 32) {
    throw new Error("Dlugosc klucza musi byc liczba calkowita >= 32.");
  }

  if (publicExponent <= 1n || (publicExponent & 1n) === 0n) {
    throw new Error("Wykladnik publiczny e musi byc nieparzysty i > 1.");
  }

  const pBits = Math.floor(keyBits / 2);
  const qBits = keyBits - pBits;

  while (true) {
    const p = generatePrime(pBits);
    const q = generatePrime(qBits);

    if (p === q) {
      continue;
    }

    if (gcd(publicExponent, p - 1n) !== 1n) {
      continue;
    }

    if (gcd(publicExponent, q - 1n) !== 1n) {
      continue;
    }

    const n = p * q;
    if (bitLength(n) < keyBits) {
      continue;
    }

    const phi = (p - 1n) * (q - 1n);
    const d = modInverse(publicExponent, phi);

    return {
      publicKey: { n, e: publicExponent },
      privateKey: { n, d },
      internals: { p, q, phi, keyBits: bitLength(n) },
    };
  }
};

/**
 * Wczytuje wiadomosc z pliku UTF-8.
 * @param {string} filePath
 * @returns {string}
 */
const readMessageFromFile = (filePath) => fs.readFileSync(filePath, "utf8");

/**
 * Weryfikuje, czy tekst nalezy do alfabetu ASCII.
 * @param {string} text
 */
const assertAsciiText = (text) => {
  if (/[^\x00-\x7F]/.test(text)) {
    throw new Error("Wiadomosc musi zawierac tylko znaki ASCII (0-127).");
  }
};

/**
 * Dzieli tekst na bloki o stalej liczbie znakow.
 * @param {string} text
 * @param {number} blockSize
 * @returns {string[]}
 */
const splitIntoBlocks = (text, blockSize = 10) => {
  if (!Number.isInteger(blockSize) || blockSize <= 0) {
    throw new Error("blockSize musi byc dodatnia liczba calkowita.");
  }

  const blocks = [];
  for (let i = 0; i < text.length; i += blockSize) {
    blocks.push(text.slice(i, i + blockSize));
  }

  return blocks;
};

/**
 * Koduje blok ASCII do liczby BigInt w sposob odwracalny.
 * Pierwszy bajt przechowuje faktyczna dlugosc bloku.
 * @param {string} block
 * @param {number} blockSize
 * @returns {bigint}
 */
const encodeBlockToNumber = (block, blockSize = 10) => {
  assertAsciiText(block);

  const blockBytes = Buffer.from(block, "ascii");
  if (blockBytes.length > blockSize) {
    throw new Error("Blok jest dluzszy niz dozwolony rozmiar.");
  }

  const packed = Buffer.alloc(blockSize + 1, 0);
  packed[0] = blockBytes.length;
  blockBytes.copy(packed, 1);

  let value = 0n;
  for (const byte of packed.values()) {
    value = (value << 8n) + BigInt(byte);
  }

  return value;
};

/**
 * Dekoduje liczbe BigInt z powrotem do bloku ASCII.
 * @param {bigint} value
 * @param {number} blockSize
 * @returns {string}
 */
const decodeNumberToBlock = (value, blockSize = 10) => {
  if (value < 0n) {
    throw new Error("Zakodowany blok nie moze byc ujemny.");
  }

  const packed = Buffer.alloc(blockSize + 1, 0);
  let temp = value;

  for (let i = packed.length - 1; i >= 0; i -= 1) {
    packed[i] = Number(temp & 255n);
    temp >>= 8n;
  }

  if (temp !== 0n) {
    throw new Error("Wartosc bloku przekracza dopuszczalny rozmiar.");
  }

  const length = packed[0];
  if (length > blockSize) {
    throw new Error("Niepoprawna dlugosc zakodowanego bloku.");
  }

  return packed.subarray(1, 1 + length).toString("ascii");
};

/**
 * Szyfruje liczbe reprezentujaca blok wiadomosci.
 * @param {bigint} messageValue
 * @param {{n: bigint, e: bigint}} publicKey
 * @returns {bigint}
 */
const encryptBlock = (messageValue, publicKey) => {
  if (messageValue < 0n || messageValue >= publicKey.n) {
    throw new Error("Wartosc bloku m musi spelniac warunek 0 <= m < n.");
  }

  return modPow(messageValue, publicKey.e, publicKey.n);
};

/**
 * Odszyfrowuje liczbe reprezentujaca blok szyfrogramu.
 * @param {bigint} cipherValue
 * @param {{n: bigint, d: bigint}} privateKey
 * @returns {bigint}
 */
const decryptBlock = (cipherValue, privateKey) => {
  if (cipherValue < 0n || cipherValue >= privateKey.n) {
    throw new Error("Wartosc szyfrogramu c musi spelniac warunek 0 <= c < n.");
  }

  return modPow(cipherValue, privateKey.d, privateKey.n);
};

/**
 * Przetwarza cala wiadomosc: podzial, kodowanie, szyfrowanie, odszyfrowanie, walidacja.
 * @param {string} filePath
 * @param {{blockSize?: number, keyBits?: number, publicExponent?: bigint}} options
 * @returns {{
 *  message: string,
 *  blocks: string[],
 *  encodedBlocks: bigint[],
 *  encryptedBlocks: bigint[],
 *  decryptedBlocks: string[],
 *  blockChecks: Array<{index: number, original: string, decrypted: string, match: boolean}>,
 *  decryptedMessage: string,
 *  isValid: boolean,
 *  publicKey: {n: bigint, e: bigint},
 *  privateKey: {n: bigint, d: bigint},
 *  keySizeBits: number
 * }}
 */
const processRsaFromFile = (
  filePath,
  { blockSize = 10, keyBits = 768, publicExponent = 65537n } = {},
) => {
  const message = readMessageFromFile(filePath);
  assertAsciiText(message);

  const { publicKey, privateKey, internals } = generateRsaKeyPair(
    keyBits,
    publicExponent,
  );

  const blocks = splitIntoBlocks(message, blockSize);
  const encodedBlocks = blocks.map((block) => encodeBlockToNumber(block, blockSize));

  encodedBlocks.forEach((value, index) => {
    if (value >= publicKey.n) {
      throw new Error(
        `Blok ${index} jest zbyt duzy (m >= n). Zwieksz dlugosc klucza RSA.`,
      );
    }
  });

  const encryptedBlocks = encodedBlocks.map((value) => encryptBlock(value, publicKey));
  const decryptedNumbers = encryptedBlocks.map((value) =>
    decryptBlock(value, privateKey),
  );
  const decryptedBlocks = decryptedNumbers.map((value) =>
    decodeNumberToBlock(value, blockSize),
  );

  const blockChecks = blocks.map((original, index) => {
    const decrypted = decryptedBlocks[index];
    return {
      index,
      original,
      decrypted,
      match: original === decrypted,
    };
  });

  const decryptedMessage = decryptedBlocks.join("");
  const isValid = blockChecks.every((entry) => entry.match) && message === decryptedMessage;

  return {
    message,
    blocks,
    encodedBlocks,
    encryptedBlocks,
    decryptedBlocks,
    blockChecks,
    decryptedMessage,
    isValid,
    publicKey,
    privateKey,
    keySizeBits: internals.keyBits,
  };
};

/**
 * Pokazuje, co dzieje sie gdy m >= n, bez walidacji wejscia.
 * @param {{n: bigint, e: bigint}} publicKey
 * @param {{n: bigint, d: bigint}} privateKey
 * @returns {{m: bigint, n: bigint, cipher: bigint, decrypted: bigint, reduced: bigint, equalToOriginal: boolean}}
 */
const demonstrateMessageAtLeastN = (publicKey, privateKey) => {
  const m = publicKey.n + 42n;
  const cipher = modPow(m, publicKey.e, publicKey.n);
  const decrypted = modPow(cipher, privateKey.d, privateKey.n);

  return {
    m,
    n: publicKey.n,
    cipher,
    decrypted,
    reduced: m % publicKey.n,
    equalToOriginal: decrypted === m,
  };
};

module.exports = {
  bitLength,
  gcd,
  modInverse,
  modPow,
  isProbablePrime,
  generatePrime,
  generateRsaKeyPair,
  readMessageFromFile,
  assertAsciiText,
  splitIntoBlocks,
  encodeBlockToNumber,
  decodeNumberToBlock,
  encryptBlock,
  decryptBlock,
  processRsaFromFile,
  demonstrateMessageAtLeastN,
};
