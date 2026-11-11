# Przegląd filmu

Wybrano pełną sprawę narodzin dziecka: gotowy wynik → początek sprawy → dane i dokument → USC → ZUS → podgląd agenta → PDF → demo. Alternatywy „Ślad jednego dokumentu” i „Zajrzyj do środka” zapisano w STORYLINES.md. Obrazy produktu pochodzą z rzeczywistego publicznego prototypu, bez domalowanych kontrolek.

## Sprawdzone

- HyperFrames check: lint, runtime, layout, kontrast, ruch i audio — bez błędów. Po powiększeniu podpisów do 28 px i oznaczeniu zamierzonego czasu na czytanie PDF-a również zero ostrzeżeń craft.
- Obejrzano plansze scen, telefonu i siedmiu cięć oraz wybrane pełne klatki.
- Niezależny przegląd wykrył pozorne cofnięcie procesu przy 15 s. Przygotowano fizycznie przycięte klipy, a kamerę na szwie pozostawiono w tym samym miejscu. Klatki 14,9 i 15,2 s pokazują teraz tę samą propozycję USC i ciąg dalszy zatwierdzenia.
- Rzeczywiste nagranie przeszło bez błędów JavaScript. Trzy główne ścieżki publicznego demo wcześniej przeszły osobną kontrolę i pobieranie PDF-ów.
- Podkład na licencji CC BY 4.0 ma podpis na końcu i w assets/CREDITS.md. Brak lektora.

## Świadome ograniczenia

Najgęstsze ujęcie to JSON w podglądzie agenta. Na telefonie pokazuje możliwość zajrzenia do narzędzi, nie służy czytaniu wszystkich pól; pełną treść można obejrzeć w aplikacji. Przy większym budżecie czasu nagrałbym tę scenę w wyższej rozdzielczości i z dłuższym zatrzymaniem na samym wyniku narzędzia.

Nie sprawdzono odbioru z widzem nieznającym projektu. Dźwięk jest kontrolowany narzędziami, bez odsłuchu przez człowieka; pomiar końcowego MP4 i kontrola zdekodowanych klatek są ostatnim krokiem dostarczenia.

## Kontrola gotowego MP4

Zdekodowano i obejrzano klatki z gotowego pliku, w tym pracę ZUS i planszę końcową. ffprobe: H.264, 1920×1080, 30 fps, 1440 klatek, 48,000 s; audio AAC stereo, 48,000 s. Rozmiar 6 691 108 bajtów. Głośność -16,56 LUFS, true peak -3,59 dBTP. Analiza HyperFrames potwierdza obecność muzyki i brak ostrzeżeń audio. Dźwięku nie odsłuchiwał człowiek. Render trwał 44,8 s; screenshot capture, hardware GPU.
