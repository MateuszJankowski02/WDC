Data: 2026-03-26

Kontekst:

- Repozytorium: WDC
- Zakres: Lab1 + instrukcja z `Lab1/Projekt 1.pdf`
- Zrodla merytoryczne: `Lab1/ISO27001.pdf` (ISO/IEC 27002:2005) oraz `Lab1/ustawa_o_ochronie.pdf`
- Dokument zespolu: `Lab1/WdC - Notatki.pdf`
- Cel: przygotowac brakujace tematy i klauzule/artykuly dla **obowiazkow providera uslug**

Wymagania z instrukcji (skrot):

1. Podsumowac prawa konsumenta systemu informatycznego.
2. Podsumowac obowiazki developera oprogramowania systemu informatycznego.
3. Podsumowac obowiazki providera uslug oferowanych przez system informatyczny.

Uwaga dla tej iteracji:

- Pracujemy tylko na czesci: **obowiazki providera**.
- Nie duplikujemy punktow, ktore sa juz wpisane w `WdC - Notatki`.
- Proponujemy brakujace zapisy, ktore da sie obronic na bazie ISO + ustawy.

Co zespol ma juz pokryte (provider):

- ISO/IEC 27002: 6.2.3, 8.1.2, 10.2.1, 10.2.2, 10.3.1, 10.3.2, 10.6.1, 10.6.2,
  10.10.4, 10.10.5, 10.10.6, 12.4.1, 12.4.2, 12.5.2, 12.5.3, 13.1.1, 13.2.1,
  13.2.2, 13.2.3, 14.1.3, 15.3.1.
- Ustawa: art. 8, art. 10 ust. 1, art. 11, art. 25 ust. 1 pkt 3, art. 58, art. 84, art. 107.

Brakujace tematy rekomendowane do rozwiniecia (provider):

1. ISO 10.5.1 - Information back-up (backup, retencja, testy odtwarzania).
2. ISO 10.1.2 - Change management (formalny proces zmian + rollback).
3. ISO 10.1.3 - Segregation of duties (rozdzial rol i odpowiedzialnosci).
4. ISO 10.10.3 - Protection of log information (integralnosc i ochrona logow).
5. ISO 11.2.4 - Review of user access rights (cykliczne przeglady uprawnien).
6. ISO 12.3.2 - Key management (cykl zycia kluczy kryptograficznych).
7. ISO 12.6.1 - Control of technical vulnerabilities (skanowanie, SLA, remediacja).
8. ISO 14.1.5 - Testing and maintaining continuity plans (regularne testy BCP/DR).
9. Ustawa art. 10 ust. 4 + art. 11a (zmiany danych IOD i zastepstwo IOD).
10. Ustawa art. 53-55 (standardowe klauzule, rekomendacje techniczne, obsluga zgloszen naruszen).

Szybki shortlist do oddania (3-5 najbezpieczniejszych):

1. ISO 10.5.1
2. ISO 12.6.1
3. ISO 11.2.4
4. ISO 10.10.3
5. Ustawa art. 10 ust. 4 + 11a

Instrukcja dla kolejnych iteracji odpowiedzi (dla agenta):

- Najpierw sprawdz, czy nowy punkt nie jest juz wpisany w `Lab1/WdC - Notatki.pdf`.
- Dla kazdego nowego punktu dawaj:
  - krotkie uzasadnienie "dlaczego istotne dla providera",
  - gotowy akapit/klauzule w stylu formalnym,
  - odniesienie do konkretnego artykulu/klauzuli.
- Pilnuj jezyka: zwięzly, techniczno-prawny, bez lania wody.
- Nie mieszaj odpowiedzialnosci developera i providera.
- Jesli uzytkownik prosi o krotsza forme, generuj wersje "do oddania" na 5 punktow.

Status:

- Utworzono pamiec kontekstu dla Lab1 w `.github/agent_memory_lab1.md`.
- Poprzedni plik roboczy poza `.github` zostal usuniety, aby uniknac rozjazdu wersji.
