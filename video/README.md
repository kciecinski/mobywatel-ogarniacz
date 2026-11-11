# Film demonstracyjny — mObywatel — Ogarniacz

48 sekund, 1920×1080, 30 fps. Rzeczywiste nagranie publicznego prototypu pokazuje narodziny dziecka: udostępnienie danych, zgody, pracę USC i ZUS, podgląd narzędzi agenta i dokumenty PDF.

## Edycja i render

Node.js >=22, FFmpeg i przeglądarka Chromium (HyperFrames potrafi przygotować własną):

```sh
npx --yes hyperframes@0.9.33 preview --background
npx --yes hyperframes@0.9.33 check --json
npx --yes hyperframes@0.9.33 render --quality delivery --fps 30 --workers 2 --video-frame-format png --output renders/ogarniacz-demo.mp4
```

`index.html` składa osiem scen z `compositions/`. Tytuły można zmieniać w edytorze albo bezpośrednio w plikach. `scripts/build-film.py` jest pomocniczym generatorem; jego ponowne uruchomienie nadpisuje sceny, więc po ręcznych zmianach edytuj również generator albo go pomiń.

`STORYLINES.md`, `SPEC.md` i `REVIEW.md` opisują kierunek filmu, montaż i weryfikację. W `assets/` są lokalne nagrania i zasoby; render nie musi pobierać treści aplikacji. Podkład jest już przycięty do filmu. Pełna atrybucja i źródła: [assets/CREDITS.md](assets/CREDITS.md). Zachowaj ją przy dalszej publikacji.

Film pokazuje symulację na fikcyjnych danych. Kolejne sceny są montowane i miejscami przyspieszane; nie jest to pomiar czasu załatwiania spraw w urzędach. Brak lektora. Dźwięk sprawdzono pomiarem, bez odsłuchu przez człowieka.
