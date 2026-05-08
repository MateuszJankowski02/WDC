Data: 2026-04-09

Aktualizacja #1

1. Task goal and acceptance criteria

- Cel: zrealizowac Lab3 (RSA + faktoryzacja) zgodnie z instrukcja.
- Kryteria akceptacji:
  - RSA: wczytanie z pliku, bloki 10-znakowe, odwracalne mapowanie blok<->liczba,
    klucz >= 768 bit, szyfrowanie i odszyfrowanie blok po bloku, walidacja zgodnosci.
  - Czesc opisowa: uzasadnienie e, przypadek m >= n, deterministycznosc RSA bez paddingu,
    wyjasnienie OAEP.
  - Faktoryzacja: benchmark dla 32..88 bit, tabela z czasami/iteracjami/sukcesem,
    dopasowanie co najmniej 2 krzywych, wybor po R^2, ekstrapolacja 96/128/256,
    komentarz o wiarygodnosci prognoz dla 1024/2048.
  - Testy automatyczne przechodza lokalnie.

2. Relevant files and current code state

- `Lab3/rsa.js`:
  - implementacja BigInt RSA (Miller-Rabin, klucze, modPow, modInverse),
  - dzielenie na bloki 10 znakow,
  - odwracalne kodowanie/dekodowanie blokow ASCII,
  - szyfrowanie/odszyfrowanie z walidacja m < n,
  - demonstracja przypadku m >= n.
- `Lab3/factorization.js`:
  - Pollard Rho,
  - benchmark faktoryzacji dla zadanych rozmiarow klucza,
  - dopasowanie modeli liniowy/potegowy/wykladniczy,
  - wybor najlepszego modelu przez R^2,
  - ekstrapolacja 96/128/256.
- `Lab3/main.js`:
  - uruchamia RSA i benchmark,
  - wypisuje tabele wynikow,
  - wypisuje rownania modeli, R^2 i ekstrapolacje.
- `Lab3/lab3.test.js`:
  - testy jednostkowe i integracyjne dla RSA/faktoryzacji.
- `Lab3/example.txt`:
  - probka danych ASCII do demonstracji.
- `Lab3/sprawozdanie_lab3.md`:
  - gotowe sprawozdanie z odpowiedziami i wynikami.

3. Source materials (including converted text from PDFs when applicable)

- Uzyto tekstowej wersji instrukcji: `Lab3/WdC_Lab 3 — kopia.txt`.
- Dostepne byly tez: `Lab3/WdC_Lab 3 — kopia.pdf` i `Lab3/WdC_Lab 3 — kopia.md`.
- Zgodnie z regula PDF -> analiza oparta na `.txt`.

4. Constraints and assumptions

- Jezyk implementacji: Node.js CommonJS.
- Operacje na duzych liczbach: BigInt.
- Alfabet wybrany do zadania: ASCII.
- Brak zewnetrznych bibliotek kryptograficznych.
- Czasy benchmarku sa niestabilne miedzy uruchomieniami (losowosc generacji i Pollard Rho).

5. Iteration notes and next actions

- Zrealizowano kod produkcyjny i testy dla Lab3.
- Zweryfikowano testy: `npm test` -> wszystkie zielone (Lab2 + Lab3).
- Zweryfikowano uruchomienie scenariusza: `node Lab3/main.js`.
- Wygenerowano sprawozdanie w `Lab3/sprawozdanie_lab3.md`.
- Ryzyka:
  - benchmark i dopasowanie modeli sa wrazliwe na losowosc i pojedyncze outliery,
  - daleka ekstrapolacja (szczegolnie 256+ bit) ma charakter pogladowy.
- Status: Lab3 przygotowany do oddania.
