const crypto = require("crypto");

// Obliczanie największego wspólnego dzielnika (NWD) dwóch liczb a i b
const nwd = (a, b) => {
  let x = a;
  let y = b;

  while (y !== 0n) {
    [x, y] = [y, x % y];
  }

  return x;
};

const randomBigInt = (min, max) => {
  const range = max - min + 1n; // Oblicz zakres liczb do wygenerowania
  const bytes = Math.ceil(range.toString(2).length / 8); // Oblicz liczbę bajtów potrzebną do reprezentacji zakresu

  while (true) {
    // Wygeneruj losową liczbę całkowitą z zakresu [0, range-1]
    const rnd = BigInt(`0x${crypto.randomBytes(bytes).toString("hex")}`); //
    if (rnd < range) {
      return min + rnd;
    }
  }
};

// Funkcja do generowania losowego ziarna s, które jest liczbą
// całkowitą w zakresie [1, n-1] i jest względnie pierwsza z n
const getRandomSeed = (n) => {
  let s;
  do {
    s = randomBigInt(1n, n - 1n);
  } while (nwd(s, n) !== 1n);

  return s;
};
/*
    Blum Blum Shub (BBS) to kryptograficzny generator liczb pseudolosowych, który opiera się na trudności faktoryzacji dużych liczb całkowitych. 
    BBS działa na zasadzie wyboru dwóch dużych liczb pierwszych p i q, które spełniają warunek p % 4 === 3 i q % 4 === 3. Następnie oblicza n = p * q.
    Generator BBS jest inicjalizowany ziarna s, które jest liczbą całkowitą w zakresie [1, n-1] i jest względnie pierwsza z n. 
    Następnie generuje ciąg pseudolosowych bitów Z(i) poprzez iteracyjne obliczanie X(i) = X(i-1)^2 mod n, gdzie X(0) = s^2 mod n, a Z(i) = X(i) mod 2.

    @param {number} bitCount - liczba bitów do wygenerowania
    @returns {object} - obiekt zawierający wartości p, q, n, seed oraz wygenerowane bity i ich reprezentację jako string
*/
const blumBlumShub = (bitCount) => {
  const p = 2147483647n; // p % 4 === 3
  const q = 4294967291n; // q % 4 === 3
  const n = p * q;

  // Wybierz ziarno s, które jest liczbą całkowitą w zakresie [1, n-1] i jest względnie pierwsza z n
  const s = getRandomSeed(n);
  if (s < 1n || s >= n) {
    throw new Error("Seed must be in [1, n-1].");
  }
  // Sprawdź, czy s jest względnie pierwsza z n
  if (nwd(s, n) !== 1n) {
    throw new Error("Seed must be coprime with n.");
  }

  // X(0) = s^2 mod n
  let x = (s * s) % n;
  const bits = [];

  // X(i) = X(i-1)^2 mod n
  // Z(i) = X(i) mod 2
  for (let i = 1; i <= bitCount; i += 1) {
    x = (x * x) % n;
    bits.push(Number(x % 2n));
  }

  return bits.join(""); // Reprezentacja bitów jako string
};

module.exports = {
  blumBlumShub,
};
