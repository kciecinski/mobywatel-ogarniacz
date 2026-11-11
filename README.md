# mObywatel — Ogarniacz

**Jedna sprawa. Współpraca wielu instytucji.**

[Otwórz demo](https://mobywatel-ogarniacz.pages.dev/) · [Obejrzyj film (48 s)](demo/ogarniacz-demo.mp4)

https://github.com/user-attachments/assets/e744ec76-0a3e-4563-95fe-bb541107f64a

Klikalny, nieoficjalny prototyp przygotowany w kontekście mObywatel Challenge. Obywatel zaczyna od celu, udostępnia potrzebne dane i zatwierdza działania. Ogarniacz dobiera agentów instytucji, koordynuje ich pracę i doprowadza sprawę do rezultatu.

To demonstracja na fikcyjnych danych i przygotowanych dialogach. Nie korzysta z prawdziwego AI, nie łączy się z urzędami, nie składa rzeczywistych wniosków ani nie wykonuje płatności. PDF-y są oznaczonymi przykładami.

## Zobacz w praktyce

- **Narodziny dziecka** — USC uzyskuje akt urodzenia i PESEL, a ZUS wykorzystuje je we wniosku o 800+.
- **Zamknięcie firmy** — sekwencyjna współpraca ZUS, CEIDG i urzędu skarbowego.
- **Budowa domu** — zależności pomiędzy decyzjami gminy, starosty i nadzoru budowlanego.

Łącznie 12 spraw oraz warianty korekty danych, niedostępności agenta i oczekiwania na decyzję. W każdej sprawie dane mają wskazane źródło, działanie wymaga zgody, a wynik pozostawia dokumenty do pobrania. Kliknięcie agenta otwiera jego osobny wątek z symulowanymi wywołaniami narzędzi i wynikami. Szczegóły: [ścieżki prezentacji](SHOWCASE.md) i [kontrakty danych](DATA-FLOW-AUDIT.md).

## Uruchomienie

Node.js >=22.12.0; wersja używana przy przygotowaniu projektu znajduje się w `.nvmrc`.

```sh
npm ci
npm run dev
```

## Sprawdzenie i build

```sh
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

Testy przeglądarkowe domyślnie otwierają Chromium. W Linuxie bez ekranu można użyć `xvfb-run npm test`. Testy zapisują PDF-y, zrzuty i raporty w katalogu wynikowym Playwright (`test-results/`), bez zależności od ścieżek konkretnego systemu. Dodatkowa weryfikacja wdrożenia:

```sh
RELEASE_AUDIT_URL=https://mobywatel-ogarniacz.pages.dev/ npm test -- tests/release-audit.spec.ts --workers=3
```

## Architektura

React 19, TypeScript, Vite, Motion, Open Bot Avatar i jsPDF. `src/flow.ts` odtwarza stan sprawy z zatwierdzonych zdarzeń. `src/input-contracts.ts` pilnuje wymaganych danych i ich źródeł. `src/mock-tools.ts` opisuje symulowane działania instytucji, a `src/artifacts.ts` generuje przykładowe dokumenty.

Aplikacja nie wymaga backendu ani kluczy API. Dane są zapisywane w localStorage tej przeglądarki; nie synchronizują się między urządzeniami. Wszystkie teksty i warianty odpowiedzi są przygotowane na potrzeby demonstracji.

## Publikacja

`npm run build` tworzy statyczny katalog `dist/`. Aktualne demo działa w Cloudflare Pages pod adresem https://mobywatel-ogarniacz.pages.dev/. Wdrożenie korzysta z Direct Upload; push do tego repozytorium sam nie aktualizuje strony. Widoki korzystają z fragmentów URL, np. `/#przeglad` i `/#agenci`.

## Film demonstracyjny

[Gotowy MP4](demo/ogarniacz-demo.mp4): 48 s, 1920×1080, 30 fps, około 6,4 MB. Projekt HyperFrames do edycji jest w [video/](video/). Film pokazuje rzeczywiste nagranie prototypu z montażem i przyspieszeniami, bez lektora. Atrybucję muzyki zawiera plansza końcowa i [CREDITS.md](video/assets/CREDITS.md); zachowaj ją przy publikacji.

## Zależności i licencje

Noty bibliotek: [THIRD-PARTY-NOTICES.txt](public/THIRD-PARTY-NOTICES.txt). Czcionka Noto Sans: [OFL.txt](public/fonts/OFL.txt). Publiczne udostępnienie tego prototypu nie oznacza oficjalnej współpracy z administracją publiczną ani wdrożenia integracji urzędowych.
