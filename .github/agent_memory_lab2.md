Data: 2026-03-26

Kontekst:

- Repozytorium: WDC
- Zakres: Lab2 + instrukcja z "Lab2/Projekt 2.pdf"
- Cel analizy: zgodność implementacji i testów z wymaganiami zadania 2

Wymagania z PDF (skrót):

1. Wczytanie wiadomości z pliku
2. Zamiana tekstu na bity
3. Wygenerowanie klucza odpowiedniej długości własnym BBS
4. Sprawdzenie losowości klucza (2 testy NIST)
5. Szyfrowanie
6. Odszyfrowanie
7. Sprawdzenie zgodności

Wnioski z analizy kodu:

- `Lab2/main.js` realizuje pełny pipeline 1-7.
- `Lab2/helpers.js` zawiera własną implementację BBS (bez zewnętrznych bibliotek, poza wbudowanym `crypto`).
- Użyte testy statystyczne: Monobit + Runs (NIST) — wymaganie 4 spełnione.
- Szyfrowanie i odszyfrowanie przez XOR tym samym kluczem — zgodne z ideą szyfru doskonałego.

Wnioski z analizy testów:

- `Lab2/lab2.test.js` pokrywa:
  - konwersję UTF-8 tekst <-> bity,
  - własność XOR (odszyfrowanie tym samym kluczem),
  - odrzucanie oczywiście nielosowego ciągu przez testy NIST,
  - pełny przepływ end-to-end na `example.txt`.
- Testy przechodzą lokalnie (`4/4`).

Luki / ryzyka:

- Brak testów stricte pod BBS (np. długość, alfabet bitowy, losowość inter-run, poprawne błędy wejścia).
- Brak testów błędów wejścia dla `bitsToText`, `xorBits`, testów NIST.
- Komunikaty błędów w kodzie są po angielsku (użytkownik preferuje polski).
- Dla pustej wiadomości pipeline może rzucać wyjątek na etapie testów NIST (wymagane >= 1 bit).

Sugestie ulepszeń (bez dodatkowych bibliotek produkcyjnych):

1. Dodać testy jednostkowe BBS i walidacji błędów.
2. Ujednolicić komunikaty błędów i komentarze na język polski.
3. Jawnie obsłużyć przypadek pustej wiadomości (np. czytelny błąd biznesowy).
4. Rozważyć wyprowadzenie raportu NIST do osobnej funkcji/modułu dla czytelności.

---

Aktualizacja po wdrożeniu (zrealizowane):

- Zmieniono komunikaty błędów na polskie w `Lab2/main.js` i `Lab2/helpers.js`.
- Uporządkowano/ujednolicono komentarze w `Lab2/helpers.js`.
- Dodano ochronę przed pustą wiadomością wejściową w `processPerfectCipher` (`Lab2/main.js`).
- Rozszerzono testy w `Lab2/lab2.test.js`:
  - walidacje `bitsToText` (niedozwolone znaki, zła długość),
  - walidacja `xorBits` dla nierównych długości,
  - testy BBS (długość, alfabet, 0 bitów, błędne argumenty),
  - walidacje wejścia testów NIST,
  - przypadek pustego pliku wejściowego dla pełnego pipeline.
- Eksportowano `nwd` z `Lab2/helpers.js` (na potrzeby potencjalnych dalszych testów jednostkowych).
- Wynik testów po zmianach: 13/13 testów przechodzi.

Kolejna iteracja (komentarze JSDoc):

- Dodano komentarze w stylu Javadoc/JSDoc dla wszystkich funkcji w `Lab2/main.js`:
  - `readMessageFromFile`, `textToBits`, `bitsToText`, `assertBitString`, `xorBits`,
    `erf`, `erfc`, `nistMonobitTest`, `nistRunsTest`, `processPerfectCipher`, `main`.
- Dodano komentarze JSDoc dla wszystkich funkcji w `Lab2/helpers.js`:
  - `nwd`, `randomBigInt`, `getRandomSeed`, `blumBlumShub`.
- Zweryfikowano poprawność zmian testami: nadal 13/13 na zielono.

Kolejna iteracja (komentarze „po co i dlaczego”):

- Rozszerzono JSDoc o uzasadnienie celu (nie tylko „co robi”) dla kluczowych pojęć:
  - testy NIST (Monobit i Runs) w `Lab2/main.js`,
  - elementy BBS (`nwd`, `randomBigInt`, `getRandomSeed`, `blumBlumShub`) w `Lab2/helpers.js`.
- Dodano kontekst praktyczny: wpływ jakości klucza na bezpieczeństwo pipeline'u szyfrowania.
- Testy po zmianie dokumentacji: 13/13.

Kolejna iteracja (interpretacja pValue):

- Rozszerzono dokumentację testów NIST w `Lab2/main.js` o praktyczne czytanie wyniku:
  - co oznacza `pValue >= 0.01`,
  - jak rozumieć `pass=true/false` w decyzji o jakości klucza,
  - dlaczego pojedynczy test nie wystarcza do „potwierdzenia losowości”.
- Doprecyzowano znaczenie `randomnessReport` jako sygnału jakości klucza przed użyciem.
- Testy nadal przechodzą: 13/13.

Uwagi techniczne:

- Nie dodano nowych bibliotek produkcyjnych.
- Pozostawiono istniejące narzędzie testowe (`vitest`).
