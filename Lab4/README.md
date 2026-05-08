# Laboratorium 4 - Implementacja i Badanie SHA-256

Niniejszy dokument stanowi krótkie, krokowe wyjaśnienie działania programu przygotowanego na Laboratorium 4 oraz uzasadnienie wykonywanych operacji.

## Jak działa program i dlaczego tak robimy?

Program dzieli się na dwie części: matematyczną implementację algorytmu SHA-256 (`sha256.js`) oraz skrypt testujący właściwości tej funkcji skrótu (`index.js`).

### Krok 1: Padding wiadomości (Dopełnienie wejścia) i konstrukcja Merkle'a-Damgårda

- **Co robimy:** Zanim policzymy skrót, musimy dokleić do wiadomości bit `1` (w postaci bajtu `0x80`), następnie zera, a na samym końcu 64-bitową informację o oryginalnej długości wiadomości.
- **Dlaczego:** SHA-256 opiera się na tzw. **konstrukcji Merkle'a-Damgårda**. Oznacza to, że algorytm posiada wewnętrzny stan wielkości 256 bitów, ale dane "połyka" i przetwarza w blokach o rozmiarze dokładnie 512 bitów (64 bajty). Dopełnienie gwarantuje nam, że całkowity rozmiar przesyłanej do algorytmu wiadomości będzie wielokrotnością 512 bitów. W ten sposób funkcja wchłania kolejne 512-bitowe bloki i miesza je ze swoim 256-bitowym stanem, by na samym końcu zwrócić ostateczny, 256-bitowy wynik (skrót).

### Krok 2: Główna pętla kompresji

- **Co robimy:** Dla każdego 64-bajtowego bloku, program rozwija go do tablicy 64 słów (`W[0..63]`), a następnie w 64 iteracjach miesza bity za pomocą operacji przesuwania (`rotr`), XOR (`^`), oraz dodawania modulo $2^{32}$.
- **Dlaczego:** Operacje bitowe są nieodwracalne i wprowadzają chaos (tzw. konfuzję i dyfuzję). Zapewnia to jednokierunkowość – na podstawie otrzymanego wyniku (skrótu) niemożliwe jest wywnioskowanie danych wejściowych.

### Krok 3: Badanie efektu lawinowego (Avalanche Effect)

- **Co robimy:** Skrypt testowy tworzy wiadomość początkową, liczy z niej skrót, po czym losuje w niej 1 bit, odwraca go (0 na 1 lub 1 na 0) i liczy skrót ponownie. Na koniec mierzy tzw. odległość Hamminga (liczbę różnych bitów) pomiędzy obiema wartościami wyjściowymi.
- **Dlaczego:** Jest to sprawdzian kluczowej właściwości funkcji skrótu. Nawet najmniejsza modyfikacja pliku lub tekstu wejściowego powinna całkowicie i diametralnie (w około 50%) zmieniać postać wygenerowanego skrótu. Pozwala to na szybkie i pewne wykrywanie fałszerstw plików.

### Krok 4: Porównanie wydajności z Node.js `crypto`

- **Co robimy:** Pętla uruchamia naszą autorską funkcję `sha256Custom()` 10 000 razy na tym samym tekście, a następnie robi to samo przy pomocy natywnego modułu Node.js: `crypto.createHash('sha256')`. Czas jest precyzyjnie mierzony za pomocą `performance.now()`.
- **Dlaczego:** Ponieważ JavaScript nie jest językiem natywnie kompilowanym do kodu maszynowego, operacje bitowe zawsze będą w nim wolniejsze niż odpowiedniki w C/C++. Test ten wyraźnie udowadnia, dlaczego w zastosowaniach produkcyjnych używa się wbudowanych w dany język bibliotek kryptograficznych, a nie pisze się własnych w warstwie wyższego poziomu (moduł wbudowany jest zazwyczaj ponad 3 razy szybszy).

## Architektura pliku `sha256.js` (Stałe i funkcje)

Plik `sha256.js` zawiera ścisłą implementację matematyczną algorytmu wg standardu FIPS 180-4 (NIST).

### 1. Stałe globalne

Algorytm SHA-256 opiera się na stałych, które wprowadzają "pseudo-losowość" (zapobiega to umieszczaniu kryptograficznych backdoorów, tzw. _nothing-up-my-sleeve numbers_).

- **`K` (Stałe rund)**: Tablica 64 liczb. Wyliczane są poprzez wzięcie pierwiastka sześciennego z pierwszych 64 liczb pierwszych (części ułamkowe konwertowane do 32-bitowych liczb całkowitych).
- **`H_INIT` (Początkowe wartości hasza)**: Stan startowy konstrukcji Merkle'a-Damgårda. Są to pierwsze 32 bity ułamkowe pierwiastków kwadratowych z pierwszych 8 liczb pierwszych. Razem tworzą bazowe 256 bitów.

### 2. Funkcje pomocnicze

- **`rotr(x, n)`**: Bitowe przesunięcie cykliczne w prawo. Operator `>>>` (zamiast `>>`) gwarantuje, że znak nie jest zachowywany, a my operujemy czysto na 32 bitach (dzięki temu emulujemy 32-bitowe liczby całkowite bez znaku w JavaScripcie, który normalnie posiada liczby zmiennoprzecinkowe).
- **`stringToBytes(str)`**: Konwertuje znaki (w JS zapisywane w UTF-16) na postać bezpieczną do haszowania (tablica surowych bajtów w standardzie UTF-8).

### 3. Funkcja `padMessage(msg)`

Zapewnia zgodność z wymogiem bloków o wielkości 512 bitów. Do wejścia doklejany jest bajt `0x80` (bit `1`), zera oraz na sztywnym, 8-bajtowym końcu umieszczana jest oryginalna długość wiadomości podana w bitach.

### 4. Główna funkcja `sha256Custom(message)`

Samo serce algorytmu przetwarzające wiadomość:

1. Nakłada padding (`padMessage`).
2. Główna pętla dzieli przetworzone wejście na chunki (bloki) po 64 bajty.
3. Tworzy _Message Schedule_ (`w`): Rozciąga 64 bajty wejścia na 64 słowa, z czego ostatnie 48 słów powstaje przez złożone operacje logiczne (konfuzja).
4. Rozpoczyna pętlę kompresującą (64 rundy): operując na skomplikowanych przesunięciach, dodawaniu i stałych z tablicy `K`, z każdym krokiem niszczy liniowość danych. W tym kroku aplikowane są operacje FIPS takie jak _Ch_ (Wybór) i _Maj_ (Większość).
5. Podsumowanie bloku: zmutowane bity są dodawane z powrotem do stanu bazowego `h`. Po strawieniu całej wiadomości zwracana jest gotowa wartość w postaci hex.
