const crypto = require("crypto");

/**
 * Oblicza największy wspólny dzielnik (NWD) dwóch liczb całkowitych BigInt.
 * W BBS ten krok jest potrzebny, aby upewnić się, że ziarno spełnia
 * wymagania matematyczne generatora i nie prowadzi do słabych cykli.
 * @param {bigint} a Pierwsza liczba.
 * @param {bigint} b Druga liczba.
 * @returns {bigint} Największy wspólny dzielnik.
 */
const nwd = (a, b) => {
  let x = a;
  let y = b;

  while (y !== 0n) {
    [x, y] = [y, x % y];
  }

  return x;
};

/**
 * Losuje liczbę całkowitą BigInt z domkniętego zakresu [min, max].
 * Funkcja używa kryptograficznego źródła losowości, bo od jakości losowania
 * zależy bezpieczeństwo ziarna, a więc i całego strumienia klucza.
 * @param {bigint} min Dolna granica zakresu.
 * @param {bigint} max Górna granica zakresu.
 * @returns {bigint} Wylosowana liczba z podanego zakresu.
 */
const randomBigInt = (min, max) => {
  const range = max - min + 1n;
  const bytes = Math.ceil(range.toString(2).length / 8);

  while (true) {
    const rnd = BigInt(`0x${crypto.randomBytes(bytes).toString("hex")}`);
    if (rnd < range) {
      return min + rnd;
    }
  }
};

/**
 * Losuje ziarno `s` z zakresu [1, n-1], względnie pierwsze z `n`.
 * Ten warunek jest kluczowy: poprawny wybór ziarna chroni generator
 * przed wejściem w przewidywalne lub zdegenerowane trajektorie.
 * @param {bigint} n Moduł generatora BBS.
 * @returns {bigint} Ziarno spełniające warunek NWD(s, n) = 1.
 */
const getRandomSeed = (n) => {
  let s;
  do {
    s = randomBigInt(1n, n - 1n);
  } while (nwd(s, n) !== 1n);

  return s;
};

/**
 * Generuje ciąg bitów pseudolosowych algorytmem Blum-Blum-Shub (BBS).
 * Dla stałych liczb pierwszych `p` i `q` oblicza `n = p * q`, losuje ziarno
 * `s` względnie pierwsze z `n`, a następnie iteruje:
 * `X(i) = X(i-1)^2 mod n`, `Z(i) = X(i) mod 2`.
 * W kontekście szyfru doskonałego BBS pełni rolę źródła strumienia klucza:
 * potrzebujemy sekwencji, która praktycznie nie ujawnia wzorców i utrudnia
 * odtworzenie kolejnych bitów bez znajomości parametrów generatora.
 * @param {number} bitCount Liczba bitów do wygenerowania.
 * @returns {string} Ciąg bitów (0/1) o długości `bitCount`.
 * @throws {Error} Gdy `bitCount` nie jest nieujemną liczbą całkowitą.
 * @throws {Error} Gdy ziarno nie spełnia warunków matematycznych BBS.
 */
const blumBlumShub = (bitCount) => {
  if (!Number.isInteger(bitCount) || bitCount < 0) {
    throw new Error("bitCount musi być nieujemną liczbą całkowitą.");
  }

  const p = 2147483647n; // p % 4 === 3
  const q = 4294967291n; // q % 4 === 3
  const n = p * q;

  const s = getRandomSeed(n);
  if (s < 1n || s >= n) {
    throw new Error("Ziarno musi należeć do przedziału [1, n-1].");
  }
  if (nwd(s, n) !== 1n) {
    throw new Error("Ziarno musi być względnie pierwsze z n.");
  }

  let x = (s * s) % n;
  const bits = [];

  for (let i = 1; i <= bitCount; i += 1) {
    x = (x * x) % n;
    bits.push(Number(x % 2n));
  }

  return bits.join("");
};

module.exports = {
  blumBlumShub,
  nwd,
};
