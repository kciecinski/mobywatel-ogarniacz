# Audyt źródeł danych — wszystkie scenariusze

Zasady dotyczą całej biblioteki. Dane są fikcyjne i przekazywane przez gotowe wiadomości, dokumenty albo potwierdzone narzędzia. Nie jest to lista wymogów prawnych rzeczywistych usług.

Każda akcja ma wymagane pola i zapis ich źródła. Brak wartości lub źródła blokuje potwierdzenie. Dane z rejestru można sprawdzać dopiero po wiadomości z zakresem dostępu. Narzędzie dostaje tylko dane potrzebne do swojego kroku. Dokumenty i zgody są wysyłane w composerze użytkownika, a nie domyślnie obecne u agenta.

| Scenariusz | Co podaje użytkownik | Co przekazuje w załącznikach | Co dopiero uzyskuje agent |
|---|---|---|---|
| Zamknięcie firmy | Właściciel, NIP, REGON, adres firmy, data, VAT, zatrudnienie, kasa i jej numer | Ewidencja firmy; lista pracowników, PESEL, daty i rodziny tylko przy zatrudnieniu | Potwierdzona data i wykreślenie z CEIDG → ZUS i VAT-Z; przy kasie osobne zamknięcie i wyrejestrowanie |
| Narodziny dziecka | Rodzic, dane dziecka, dane drugiego rodzica, sytuacja rodzinna, rachunek do 800+ | Karta urodzenia z imieniem, datą, miejscem i płcią | Akt urodzenia i PESEL dopiero po rejestracji → użyte przez ZUS do 800+ |
| Kupno mieszkania | Rynek zakupu, adres, udział, powierzchnia, księga, data i sprzedający | Akt notarialny z ceną, notariuszem, rozliczeniem PCC i identyfikatorem aktu | Rozliczenie notarialne i dokonany wpis własności; IN-1 z tych samych danych |
| Budowa domu | Działka, plan miejscowy, tytuł do działki, projekt, kierownik i planowany start | Projekt, dane autora i podstawa prawa do działki | Decyzja WZ tylko bez planu → pozwolenie → zgłoszenie rozpoczęcia robót |
| Śmierć bliskiej osoby | Wnioskodawca, osoba zmarła i PESEL, relacja, kto opłacił pogrzeb, rachunek do wypłaty | Karta zgonu, a przy już zgłoszonym zgonie odpis aktu; rachunki i udział w kosztach | Akt po rejestracji, jeśli go nie było; ZUS używa aktu i rzeczywiście przesłanych kosztów, w tym udziału wnioskodawcy |
| Dziedziczenie mieszkania | Spadkodawca i PESEL, relacja, podstawa dziedziczenia, udział, inni spadkobiercy, nieruchomość i wartość, rachunek do opłat | Dokumenty spadkowe; akt zgonu i dokument relacji albo posiadane potwierdzenie dziedziczenia | Potwierdzenie dziedziczenia tylko gdy nie zostało już dostarczone → SD-Z2 i księga wieczysta |
| Zmiana nazwiska po ślubie | Nowe nazwisko, dotychczasowy dowód, paszport jeśli dotyczy, adres doręczeń i rachunek do opłat | Akt małżeństwa i zdjęcie JPG | Zdalna weryfikacja na podstawie przesłanych danych i zdjęcia, nowe dokumenty i potwierdzenie doręczenia |
| Przeprowadzka | Nowy i poprzedni adres, data zamieszkania, pobyt stały/czasowy, termin końcowy tylko przy czasowym | Dokument do lokalu i zgoda właściciela | Meldunek i aktualizacja powiązanych rejestrów, bez wymyślania nowego adresu |
| Kupno używanego samochodu | Auto, VIN, rejestracja, wartość rynkowa, data zakupu, sprzedający, pochodzenie i rachunek do płatności | Umowa z danymi sprzedającego, dowód rejestracyjny oraz potwierdzenie OC jako osobne pliki | Wyliczenie PCC z wartości tego auta, płatność z podanego rachunku, rejestracja i dokumenty |
| Orzeczenie i świadczenie wspierające | Osoba objęta wsparciem, PESEL, podstawa reprezentacji, status decyzji i rachunek | Dokumentacja medyczna przy braku decyzji albo ostateczna decyzja z numerem i punktami | Ostateczna decyzja WZON, jeśli jej nie było → dopiero potem wniosek i wypłata w ZUS |
| Wezwanie z urzędu skarbowego | Numer wezwania, urząd, daty, rok podatkowy i rodzaj załączników | Wezwanie oraz pakiet wskazanych faktur/rachunków | Odpowiedź odnosząca się do tego wezwania, weryfikacja załączników i zamknięcie sprawy |
| Chwilowa niedostępność agenta | Firma i NIP, okres i konkretny zakres rozliczenia | Rozliczenie podatkowe i składkowe z informacją o braku dopłaty w tym przykładzie | Zamknięcie rozliczenia podatku; odzyskanie połączenia z ZUS i zamknięcie składek bez utraty już podanych danych |

## Wspólne dane i uprawnienia

Imię, nazwisko, PESEL, adres i kontakt są wysłaną wiadomością użytkownika. Pełny przykładowy rachunek jest jawnie przesłany; narzędzia nie dopisują numeru na podstawie zamaskowanej końcówki. Odrębna wiadomość wskazuje rejestry dostępne dla danej sprawy. Potwierdzenie konkretnego działania nadal jest wymagane przed wykonaniem.

Załączniki zawierają odpowiednie pola, powiązane z wcześniejszymi odpowiedziami. Zdjęcie jest JPG, nie pozornym PDF. Dokument potwierdzenia istniejącej decyzji nie jest zastępowany przez dokumentację dopiero do jej wydania. Pracownicy, paszport, pobyt czasowy i kasa fiskalna wprowadzają pytania i kroki tylko wtedy, gdy dotyczą wybranego wariantu.

Wynik innego agenta ma inne źródło niż odpowiedź użytkownika. PESEL dziecka, akt, decyzja WZ, pozwolenie, potwierdzenie spadku i decyzja WZON nie są dostępne przed zakończeniem czynności, która je tworzy. Kolejny krok dostaje rzeczywisty wynik lokalnej symulacji, nie wartość udającą wcześniejszą wiedzę.

W szczegółach dymka: „Skąd mam dane do tego kroku?”. Mapa pól i walidacja: `src/input-contracts.ts`. Stan źródeł i blokada wykonania: `src/flow.ts`. Testy: `tests/input-contracts.spec.ts`.
