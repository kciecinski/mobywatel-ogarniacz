import { answerFields, fieldLabel, generatedByStep, requiredStepFields, sourceAllowed, sourceAttachments, remainingQuestions, type InputOrigin } from './input-contracts'
import { mockToolsForStep, type MockTool } from './mock-tools'
import { scenarios, type Case, type HistoryEntry } from './scenario'

type Scenario = (typeof scenarios)[number]
export type FlowEvent =
  | { kind: 'answer'; question: string; value: string }
  | { kind: 'tool'; step: string; tool: string }
  | { kind: 'confirm' | 'settled' | 'next' | 'pause' | 'resume' | 'retry' | 'edit' | 'correct' | 'cancel-edit' | 'advance-time'; step: string }
export type FlowAttachment = { name: string; mime: 'application/pdf' | 'image/jpeg'; data?: Record<string, string>; size: string; title: string; fields: Record<string, string> }
export type FlowOption = { value: string; label: string; message?: string; data?: Record<string, string>; attachments?: FlowAttachment[] }
export type FlowMessage = { id: string; sender: string; text: string; kind: 'text' | 'offer' | 'processing' | 'receipt' | 'calling' | 'joined' | 'extracted' | 'transferred' | 'status' | 'timeskip'; target?: string; from?: string; transferStep?: string; fields?: Record<string, string>; step?: string; attempt?: number; toolCount?: number; attachments?: FlowAttachment[] }
export type FlowStep = {
  id: string; taskId: string; institution: string; title: string; kind: 'submit' | 'check' | 'consent'
  offer: string; confirm: string; processing: string; receipt: string; next?: string; documents: string[]; tools: MockTool[]; missingData: string[]; dataSources: { field: string; label: string; value: string; source: string }[]; unavailable?: boolean
}
export type FlowQuestion = { id: string; text: string; options: FlowOption[]; presentation?: 'action' }
export type FlowProjection = {
  demo?: Case['demo']; fullRoute?: boolean; timelineStage?: 'sent' | 'received' | 'decided'
  phase: 'question' | 'proposal' | 'processing' | 'receipt' | 'paused' | 'done' | 'editing' | 'waiting'
  questionIndex: number; questions: FlowQuestion[]; answerId?: string; employeeStatus?: Case['employeeStatus']; consent: boolean
  steps: FlowStep[]; index: number; completed: string[]; blocked: string[]; data: Record<string, string>; origins: Record<string, InputOrigin>; generated: Record<string, string>; attempts: Record<string, number>; toolIndex: number; messages: FlowMessage[]
}

type StepCopy = Pick<FlowStep, 'offer' | 'confirm' | 'receipt'> & Partial<Pick<FlowStep, 'kind' | 'next' | 'documents'>>
const stepCopy: Record<string, StepCopy> = {
  'birth-plan': { offer: 'Mam dane mamy i dziecka. Przygotowałem zgłoszenie urodzenia do USC Warszawa. Sprawdź je i daj mi znać, czy mogę je przekazać.', confirm: 'Potwierdź zgłoszenie urodzenia', receipt: 'Zgłoszenie przyjęte. Możemy teraz przejść do wniosku o 800+.', documents: ['Matka: Anna Nowak', 'Dziecko: Jan Nowak', 'Data i miejsce urodzenia: 24.10.2026, Warszawa', 'Karta urodzenia: 25.10.2026, przekazana do USC', 'Odbiór dokumentów: e-Doręczenia'] },
  'benefit-plan': { offer: 'Zgłoszenie urodzenia mamy za sobą. Mam też przygotowany wniosek o 800+ na podstawie danych z tej sprawy. Przekazać go do ZUS?', confirm: 'Potwierdź wniosek o 800+', receipt: '800+ przyznane. Wypłata jest uruchomiona na wskazany rachunek. Tę sprawę mamy zamkniętą.', documents: ['Wniosek SW-R', 'Rodzic i dziecko: dane z tej sprawy', 'Rachunek wskazany przez Ciebie w sprawie'] },
  'pcc-plan': { kind: 'check', offer: 'Rozliczę PCC z aktu notarialnego razem z agentem notariusza. Potwierdź, a pobiorę rozliczenie i zamknę ten krok.', confirm: 'Rozlicz PCC z notariuszem', receipt: 'Mam potwierdzenie: notariusz rozliczył PCC. Podatek załatwiony, bez podwójnej deklaracji i płatności.' },
  'kw-plan': { kind: 'check', offer: 'Odbiorę wniosek od agenta notariusza i doprowadzę wpis własności do końca w księdze wieczystej. Potwierdzasz?', confirm: 'Dokończ wpis własności', receipt: 'Wpis własności został dokonany. Księga wieczysta jest zaktualizowana — ten krok zamknięty.' },
  'in1-plan': { offer: 'Zostało zgłoszenie mieszkania do gminy. Przygotowałem IN-1 z danymi właściciela i nieruchomości. Mogę przekazać?', confirm: 'Potwierdź zgłoszenie IN-1', receipt: 'IN-1 przyjęte przez gminę. To zgłoszenie mamy z głowy.', documents: ['IN-1 — informacja o nieruchomościach i obiektach budowlanych', 'Właściciel i nieruchomość: dane z aktu w przykładowej sprawie'] },
  'mpzp-plan': { kind: 'check', offer: 'Najpierw sprawdzę plan miejscowy dla działki. Od tego zależy, czy potrzebujemy warunków zabudowy.', confirm: 'Ustal warunki dla działki', receipt: 'Sprawdziłem działkę. Dalej pójdziemy ścieżką wybraną w Twojej odpowiedzi.' },
  'wz-plan': { offer: 'Działka nie ma planu miejscowego. Mam przygotowany wniosek o warunki zabudowy do gminy — to pierwszy krok przed pozwoleniem.', confirm: 'Potwierdź wniosek o warunki zabudowy', receipt: 'Decyzja o warunkach zabudowy wydana i ostateczna. Mam ją już w dokumentach tej sprawy.' },
  'permit-plan': { offer: 'Mogę teraz przekazać przygotowany wniosek o pozwolenie na budowę wraz z przygotowaną dokumentacją. Potwierdzasz?', confirm: 'Potwierdź wniosek o pozwolenie', receipt: 'Pozwolenie na budowę wydane. Dokument jest gotowy i uprawnia do przejścia do zgłoszenia rozpoczęcia robót.' },
  'notice-plan': { offer: 'Masz już pozwolenie. Przygotowałem zawiadomienie o planowanym rozpoczęciu robót dla nadzoru budowlanego.', confirm: 'Potwierdź zawiadomienie o rozpoczęciu robót', receipt: 'Zawiadomienie przyjęte. Ten krok też mamy za sobą.' },
  'death-registration-plan': { offer: 'Pomogę ze zgłoszeniem zgonu. Dostałem od Ciebie dane osoby zmarłej i kartę zgonu w PDF. Mogę przekazać zgłoszenie do USC?', confirm: 'Potwierdź zgłoszenie zgonu', receipt: 'Zgłoszenie przyjęte. Możemy przejść do sprawy zasiłku pogrzebowego.' },
  'funeral-benefit-plan': { offer: 'Przygotowałem wniosek o zasiłek pogrzebowy z dokumentami kosztów pogrzebu z tej sprawy. Sprawdź i potwierdź, a przekażę go do ZUS.', confirm: 'Potwierdź wniosek o zasiłek pogrzebowy', receipt: 'Zasiłek pogrzebowy przyznany i wypłacony na podany rachunek. Nie musisz już składać żadnych dokumentów w tej sprawie.' },
  'inheritance-statement-plan': { kind: 'check', offer: 'Mam Twoją odpowiedź dotyczącą spadku. Zapiszę wskazane oświadczenie przez narzędzie agenta notariusza. Potwierdzasz tę decyzję?', confirm: 'Potwierdź oświadczenie spadkowe', receipt: 'Twoje oświadczenie spadkowe zapisane. Potwierdzenie dołączyłem do dokumentów sprawy.' },
  'inheritance-confirmation-plan': { offer: 'Przygotowałem wniosek o stwierdzenie nabycia spadku. Po Twoim potwierdzeniu przekażę go do sądu.', confirm: 'Potwierdź wniosek spadkowy', receipt: 'Potwierdzenie nabycia spadku wydane. Mam dokument potrzebny do podatku i wpisu własności.' },
  'inheritance-tax-plan': { offer: 'Masz potwierdzenie dziedziczenia. Przygotowałem zgłoszenie SD-Z2 dla przykładowej osoby z tej sprawy. Potwierdzasz przekazanie?', confirm: 'Potwierdź zgłoszenie SD-Z2', receipt: 'Zgłoszenie SD-Z2 przyjęte. Warunki i termin zwolnienia są zapisane w szczegółach tej sprawy.' },
  'land-register-plan': { offer: 'Teraz możemy uporządkować księgę wieczystą. Mam wniosek o wpis prawa własności na podstawie potwierdzenia dziedziczenia.', confirm: 'Potwierdź wniosek o wpis własności', receipt: 'Wpis własności dokonany. Mieszkanie jest zapisane na nowego właściciela, a potwierdzenie czeka w dokumentach.' },
  'identity-plan': { offer: 'Mam nowe nazwisko i dane z Twoich wiadomości. Złożę wniosek, przeprowadzę weryfikację tożsamości i odbiorę nowy dowód. Potwierdzasz?', confirm: 'Potwierdź wymianę dowodu', receipt: 'Nowy dowód wydany i dostarczony. Ma aktualne nazwisko; poprzedni dokument został unieważniony.', kind: 'submit' },
  'passport-plan': { offer: 'Teraz wymienię paszport. Użyję potwierdzonych danych i zdalnej weryfikacji w tej symulacji. Potwierdzasz złożenie wniosku i wydanie dokumentu?', confirm: 'Potwierdź wymianę paszportu', receipt: 'Nowy paszport wydany i dostarczony z aktualnym nazwiskiem. Poprzedni dokument został unieważniony.', kind: 'submit' },
  'permanent-residence-plan': { offer: 'Mam przygotowane zgłoszenie pobytu stałego i dane nowego adresu z tej sprawy. Sprawdź je, zanim przekażę zgłoszenie.', confirm: 'Potwierdź meldunek stały', receipt: 'Zgłoszenie pobytu stałego przyjęte. Meldunek poprzedniego adresu został uwzględniony w przykładowym zgłoszeniu.' },
  'temporary-residence-plan': { offer: 'Mam zgłoszenie pobytu czasowego pod nowym adresem. Dotychczasowy meldunek stały zostawiamy. Potwierdzasz?', confirm: 'Potwierdź meldunek czasowy', receipt: 'Zgłoszenie pobytu czasowego przyjęte. Meldunek stały pozostaje bez zmian.' },
  'id-address-plan': { kind: 'check', offer: 'Zaktualizuję powiązane rejestry po przeprowadzce i sprawdzę zgodność dokumentów, żeby nie zostało nic do poprawiania.', confirm: 'Zaktualizuj rejestry', receipt: 'Dane adresowe zsynchronizowane w rejestrach. Dowód zachowuje ważność, więc nie tworzyłem zbędnego nowego dokumentu.' },
  'car-pcc-plan': { offer: 'Auto kupione od osoby prywatnej w tej sprawie wymaga PCC. Mam PCC-3 i wyliczenie 2% wartości rynkowej z umowy. Złożę deklarację i opłacę podatek z zapisanego rachunku. Potwierdzasz oba działania?', confirm: 'Potwierdź PCC-3 i płatność', receipt: 'PCC-3 złożone, podatek opłacony. Mam oba potwierdzenia — niczego nie musisz już dopłacać.' },
  'vehicle-registration-plan': { offer: 'Mam dane auta, umowę i dokumenty z tej sprawy. Przygotowałem wniosek o rejestrację do wydziału komunikacji.', confirm: 'Potwierdź wniosek o rejestrację auta', receipt: 'Samochód zarejestrowany. Dowód rejestracyjny i potwierdzenie dostarczone, a dane właściciela zaktualizowane.' },
  'wzon-decision-plan': { kind: 'check', offer: 'Zajmę się decyzją WZON: pobiorę dane, przekażę wniosek do oceny i odbiorę ostateczną decyzję. Potem użyjemy jej w ZUS.', confirm: 'Uzyskaj decyzję WZON', receipt: 'Sprawdziłem stan decyzji podany w tej sprawie.' },
  'support-application-plan': { offer: 'Masz ostateczną decyzję na 76 punktów. Przygotowałem elektroniczny wniosek o świadczenie wspierające do ZUS.', confirm: 'Potwierdź wniosek o świadczenie', receipt: 'Świadczenie wspierające przyznane. Wypłata uruchomiona na wskazany rachunek, decyzja jest w dokumentach.' },
  'tax-summons-plan': { offer: 'Mam projekt odpowiedzi na wezwanie i trzy wskazane dokumenty. Przeczytaj projekt w podglądzie. Bez Twojego potwierdzenia go nie przekażę.', confirm: 'Potwierdź odpowiedź do urzędu', receipt: 'Odpowiedź i załączniki zweryfikowane. Urząd zamknął wezwanie — nie ma już pytań ani brakujących dokumentów.', documents: ['Wezwanie z 29.10.2026, termin: 10.11.2026', 'Treść: W odpowiedzi na wezwanie przekazuję kopie trzech wskazanych dokumentów dotyczących kosztów wykazanych w zeznaniu PIT za 2025 r. Proszę o uwzględnienie załączonych dokumentów przy dalszej weryfikacji.', 'Załączniki: kopie trzech dokumentów wskazanych w przykładowym wezwaniu'] },
  'available-tax-plan': { kind: 'check', offer: 'Najpierw rozliczę sprawę podatkową na podstawie Twoich danych. ZUS zajmie się potem swoją częścią.', confirm: 'Rozlicz sprawę podatkową', receipt: 'Sprawa podatkowa rozliczona i zamknięta. Potwierdzenie zapisane.' },
  'unavailable-social-plan': { kind: 'check', offer: 'Teraz mogę spróbować połączyć się z agentem ZUS.', confirm: 'Połącz z agentem ZUS', receipt: 'ZUS teraz nie odpowiada. Nie mam tych informacji. Możesz spróbować ponownie albo zostawić ten krok na później.' },
}

const dataQuestions: Record<string, FlowQuestion[]> = {
  'closing-business': [{ id: 'closing-date', text: 'Na jaki dzień zamykamy działalność?', options: [{ value: '28.10.2026', label: '28 października 2026' }, { value: '31.10.2026', label: '31 października 2026' }] }],
  'childbirth': [{ id: 'child', text: 'Podaj imię i nazwisko dziecka oraz datę i miejsce urodzenia.', options: [{ value: 'Jan Nowak, 24.10.2026, Warszawa', label: 'Jan Nowak, ur. 24 października w Warszawie' }, { value: 'Zofia Nowak, 25.10.2026, Warszawa', label: 'Zofia Nowak, ur. 25 października w Warszawie' }] }, { id: 'account', text: 'W profilu masz zapisany rachunek •4321. Użyć go do wypłaty 800+, czy podasz inny?', options: [{ value: 'rachunek profilu •4321', label: 'Użyj zapisanego rachunku •4321' }, { value: 'rachunek dodatkowy •8765', label: 'Podaję inny rachunek •8765' }] }],
  'buying-flat': [{ id: 'property', text: 'Podaj adres kupionego mieszkania. Pozostałe dane odczytam z aktu, który prześlesz.', options: [{ value: 'Warszawa, Lipowa 12/8', label: 'Warszawa, Lipowa 12/8' }, { value: 'Kraków, Zielona 5/3', label: 'Kraków, Zielona 5/3' }] }],
  'building-house': [{ id: 'parcel', text: 'Podaj numer działki i obręb, w którym planujesz budowę.', options: [{ value: 'działka 12/4, obręb Lipowa', label: 'Działka 12/4, obręb Lipowa' }, { value: 'działka 12/5, obręb Lipowa', label: 'Działka 12/5, obręb Lipowa' }] }],
  'bereavement': [{ id: 'deceased-person', text: 'Podaj proszę dane osoby zmarłej: imię, nazwisko i PESEL.', options: [{ value: 'jan-nowak', label: 'Jan Nowak · PESEL 00000000000', message: 'Osoba zmarła: Jan Nowak.\nPESEL: 00000000000.', data: { deceased_name: 'Jan Nowak', deceased_pesel: '00000000000' } }, { value: 'maria-nowak', label: 'Maria Nowak · PESEL 11111111111', message: 'Osoba zmarła: Maria Nowak.\nPESEL: 11111111111.', data: { deceased_name: 'Maria Nowak', deceased_pesel: '11111111111' } }] }, { id: 'death-document', text: 'Dzięki. Podeślij teraz dokument potwierdzający zgon.', options: [{ value: 'karta-zgonu.pdf', label: 'Dołącz kartę zgonu · PDF', message: 'Załączam kartę zgonu.', attachments: [{ name: 'karta-zgonu.pdf', mime: 'application/pdf', size: '148 KB', title: 'Karta zgonu', fields: { 'Imię i nazwisko': '{deceased_name}', PESEL: '{deceased_pesel}', 'Data zgonu': '27.10.2026', Miejsce: 'Warszawa' } }] }] }, { id: 'funeral-costs', text: 'Kto opłacił pogrzeb w tej sprawie?', options: [{ value: 'wnioskodawca, faktury zapisane w profilu', label: 'Ja — dołączę faktury' }, { value: 'wnioskodawca i rodzina, podział kosztów w załącznikach', label: 'Ja i rodzina — dołączę podział kosztów' }] }],
  'inheritance': [{ id: 'inheritance-choice', text: 'Napisz, jaką decyzję dotyczącą spadku mam zapisać.', options: [{ value: 'przyjęcie z dobrodziejstwem inwentarza', label: 'Przyjmuję spadek z dobrodziejstwem inwentarza' }, { value: 'potwierdzone oświadczenie z aktu notarialnego', label: 'Użyj mojego oświadczenia zapisanego u notariusza' }] }],
  'name-change': [{ id: 'surname', text: 'Jakie nowe nazwisko wpisać w dokumentach?', options: [{ value: 'Kowalska', label: 'Kowalska — tak jak w akcie małżeństwa' }, { value: 'Wiśniewska', label: 'Wiśniewska — tak jak w akcie małżeństwa' }] }],
  'moving-home': [{ id: 'address', text: 'Pod jaki adres Cię zameldować?', options: [{ value: 'Warszawa, Lipowa 12/8', label: 'Warszawa, Lipowa 12/8' }, { value: 'Kraków, Zielona 5/3', label: 'Kraków, Zielona 5/3' }] }],
  'buying-car': [{ id: 'vehicle', text: 'Podaj markę, model i wartość rynkową kupionego auta. Resztę danych odczytam z dokumentów.', options: [{ value: 'Toyota Yaris, wartość rynkowa 25000 PLN', label: 'Toyota Yaris — wartość rynkowa 25 000 zł' }, { value: 'Skoda Fabia, wartość rynkowa 40000 PLN', label: 'Škoda Fabia — wartość rynkowa 40 000 zł' }] }],
  'support-benefit': [{ id: 'account', text: 'W profilu masz zapisany rachunek •4321. Użyć go do wypłaty świadczenia, czy podasz inny?', options: [{ value: 'rachunek profilu •4321', label: 'Użyj zapisanego rachunku •4321' }, { value: 'rachunek dodatkowy •8765', label: 'Podaję inny rachunek •8765' }] }],
  'tax-summons': [{ id: 'attachments', text: 'Napisz, jakich dokumentów dotyczy wezwanie. Za chwilę poproszę Cię o pliki.', options: [{ value: 'trzy faktury wskazane w wezwaniu', label: 'Mam trzy wskazane faktury' }, { value: 'trzy rachunki wskazane w wezwaniu', label: 'Mam trzy wskazane rachunki' }] }],
  'unavailable-agent': [{ id: 'request', text: 'Co mam doprowadzić do końca?', options: [{ value: 'rozliczenie podatku i składek', label: 'Rozlicz podatek i zamknij sprawę składek' }] }],
}

const sourceDocuments: Record<string, { prompt: string; file: string; title: string }> = {
  'unavailable-agent': { prompt: 'Podeślij rozliczenie za okres, którego dotyczy sprawa. Odczytam z niego dane firmy i podstawę rozliczeń.', file: 'rozliczenie-miesiaca.pdf', title: 'Rozliczenie podatku i składek' },
  'closing-business': { prompt: 'Dołącz dane firmy i ewidencję ubezpieczeń z przykładu. Na nich oprę dokumenty do CEIDG i ZUS.', file: 'ewidencja-firmy.pdf', title: 'Dane firmy i ewidencja ubezpieczeń' },
  childbirth: { prompt: 'Dołącz jeszcze kartę urodzenia z przygotowanego przykładu.', file: 'karta-urodzenia.pdf', title: 'Karta urodzenia' },
  'buying-flat': { prompt: 'Podeślij akt notarialny, żebym miał dane zakupu i nieruchomości.', file: 'akt-notarialny.pdf', title: 'Akt notarialny zakupu mieszkania' },
  'building-house': { prompt: 'Dołącz dokumentację projektu dla tej działki.', file: 'projekt-budowlany.pdf', title: 'Dokumentacja projektu budowlanego' },
  inheritance: { prompt: 'Dołącz dokumenty spadkowe z tego przykładu.', file: 'dokumenty-spadkowe.pdf', title: 'Dokumenty sprawy spadkowej' },
  'name-change': { prompt: 'Podeślij akt małżeństwa z nowym nazwiskiem i zdjęcie do nowych dokumentów.', file: 'akt-malzenstwa.pdf', title: 'Akt małżeństwa' },
  'moving-home': { prompt: 'Dołącz dokument dotyczący nowego lokalu.', file: 'dokument-lokalu.pdf', title: 'Dokument dotyczący prawa do lokalu' },
  'buying-car': { prompt: 'Podeślij umowę kupna, dowód rejestracyjny i potwierdzenie OC.', file: 'umowa-kupna-auta.pdf', title: 'Umowa kupna samochodu' },
  'support-benefit': { prompt: 'Dołącz dokumentację sprawy WZON, na której mam pracować.', file: 'dokumentacja-wzon.pdf', title: 'Dokumentacja sprawy WZON' },
  'tax-summons': { prompt: 'Teraz dołącz PDF z dokumentami wskazanymi w wezwaniu.', file: 'zalaczniki-do-wezwania.pdf', title: 'Dokumenty wskazane w wezwaniu' },
  bereavement: { prompt: 'Podeślij jeszcze potwierdzenie kosztów pogrzebu do wniosku o zasiłek.', file: 'koszty-pogrzebu.pdf', title: 'Potwierdzenie kosztów pogrzebu' },
}

export function resolveInputText(text: string, data: Record<string, string>) { return text.replace(/\{([^}]+)\}/g, (_, field: string) => data[field] ?? '') }

export function resolveOptionAttachments(option: FlowOption, data: Record<string, string>): FlowAttachment[] {
  const uploadData: Record<string, string> = {}
  for (const attachment of option.attachments ?? []) for (const [key, value] of Object.entries(attachment.data ?? {})) if (!(key in uploadData) || value !== `{${key}}`) uploadData[key] = value
  const values = { ...uploadData, ...data }
  for (let pass = 0; pass < 4; pass++) for (const [key, value] of Object.entries(values)) values[key] = value.replace(/\{([^}]+)\}/g, (token, field: string) => values[field] && values[field] !== token ? values[field] : token)
  const resolve = (text: string) => resolveInputText(text, values)
  return (option.attachments ?? []).map(attachment => ({ ...attachment, fields: Object.fromEntries(Object.entries(attachment.fields).map(([key, value]) => [key, resolve(value)])), data: Object.fromEntries(Object.entries(attachment.data ?? {}).map(([key, value]) => [key, resolve(value)])) }))
}

export function flowQuestions(scenario: Scenario, answerId?: string, employment?: Case['employeeStatus'], knownData: Record<string, string> = {}, fullRoute = false): FlowQuestion[] {
  const primary = { id: 'answer', text: scenario.question, options: scenario.answers.map(answer => ({ value: answer.id, label: answer.label })) }
  const initial = scenario.id === 'closing-business' ? [
    { id: 'employment', text: 'Jasne, ogarnijmy zamknięcie firmy. Zatrudniasz pracowników?', options: scenario.employmentAnswers!.map(answer => ({ value: answer.status, label: answer.label })) },
    { ...primary, text: 'A jesteś czynnym podatnikiem VAT?' },
  ] : [primary]
  const context = { scenarioId: scenario.id, answerId, employment, data: knownData }
  const identity: FlowQuestion = { id: 'applicant', presentation: 'action', text: `Czy mogę użyć Twoich danych z profilu w tej sprawie? ${scenario.profile.name}, PESEL 00000000000, adres: Lipowa 10/2, 00-000 Warszawa, kontakt: osoba@example.test, obywatelstwo polskie.`, options: [{ value: scenario.profile.name, label: `Udostępnij dane: ${scenario.profile.name}`, message: `Udostępniam dane z profilu: ${scenario.profile.name}.\nPESEL: 00000000000.\nAdres: Lipowa 10/2, 00-000 Warszawa.\nKontakt: osoba@example.test.\nObywatelstwo: polskie.\nUdostępniam te dane do załatwienia tej sprawy.`, data: { applicant_name: scenario.profile.name, applicant_pesel: '00000000000', applicant_address: 'Lipowa 10/2, 00-000 Warszawa', applicant_email: 'osoba@example.test', applicant_nationality: 'PL' } }] }
  const extra = [...(dataQuestions[scenario.id] ?? []).map(question => ({ ...question, options: [...question.options] }))]
  if (scenario.id === 'bereavement') {
    const index = extra.findIndex(question => question.id === 'death-document')
    const registered = answerId === 'death-registered'
    extra[index] = { id: 'death-document', text: registered ? 'Podeślij odpis aktu zgonu. Będzie potrzebny do zasiłku.' : 'Podeślij kartę zgonu. Na jej podstawie przygotuję zgłoszenie.', options: [{ value: registered ? 'akt-zgonu.pdf' : 'karta-zgonu.pdf', label: registered ? 'Dołącz akt zgonu · PDF' : 'Dołącz kartę zgonu · PDF', message: registered ? 'Załączam odpis aktu zgonu.' : 'Załączam kartę zgonu.', attachments: [{ name: registered ? 'akt-zgonu.pdf' : 'karta-zgonu.pdf', mime: 'application/pdf', size: '148 KB', title: registered ? 'Odpis aktu zgonu' : 'Karta zgonu', fields: { 'Imię i nazwisko': '{deceased_name}', PESEL: '{deceased_pesel}', 'Data zgonu': '27.10.2026', Miejsce: 'Warszawa' }, data: { deceased_name: '{deceased_name}', deceased_pesel: '{deceased_pesel}', death_date: '27.10.2026', death_place: 'Warszawa', ...(registered ? { death_record: 'DEMO-AKT-ZGONU-USER' } : {}) } }] }] }
  }
  if (scenario.id === 'inheritance' && answerId === 'inheritance-confirmed') { const index = extra.findIndex(question => question.id === 'inheritance-choice'); if (index >= 0) extra.splice(index, 1) }
  for (const question of extra) if (question.id === 'account') question.options = question.options.map(option => ({ ...option, message: `${option.value.includes('8765') ? 'Podaję inny rachunek do wypłaty:' : 'Użyj mojego zapisanego rachunku:'} ${option.value.includes('8765') ? 'PL00 0000 0000 0000 0000 0000 8765' : 'PL00 0000 0000 0000 0000 0000 4321'}.\nWłaściciel: ja, według danych przekazanych w tej sprawie.` }))
  const sourceDocument = sourceDocuments[scenario.id]
  if (sourceDocument) extra.push({ id: 'source-document', text: sourceDocument.prompt, options: [{ value: sourceDocument.file, label: `Dołącz ${sourceDocument.file}`, message: 'Przesyłam dokumenty do tej sprawy.', attachments: sourceAttachments(context, sourceDocument.file, sourceDocument.title) }] })
  const questions: FlowQuestion[] = [...initial, identity, ...extra, ...remainingQuestions(context)]
  if (fullRoute) for (const question of questions) {
    const preferred = question.id === 'employment' ? 'employs' : question.id === 'cash-register' ? 'online' : question.id === 'answer' && scenario.id === 'building-house' ? 'without-plan' : undefined
    if (preferred) question.options = [...question.options].sort((a, b) => Number(b.value === preferred) - Number(a.value === preferred))
  }
  return questions
}

export function buildFlowSteps(scenario: Scenario, answerId: string, employeeStatus?: Case['employeeStatus'], data: Record<string, string> = {}, generated: Record<string, string> = {}, origins: Record<string, InputOrigin> = {}): FlowStep[] {
  data = { ...data, answer: answerId, ...(employeeStatus ? { employment: employeeStatus } : {}) }
  if (scenario.id === 'closing-business') {
    const steps: Omit<FlowStep, 'tools' | 'missingData' | 'dataSources'>[] = [
      { id: 'zus-consent', taskId: 'social-insurance', institution: 'ZUS', title: 'Zgoda na przekazanie daty', kind: 'consent', offer: 'Ogarnę składki. Potrzebuję do tego daty zakończenia działalności z CEIDG. Mogę ją pobrać od agenta CEIDG i wykorzystać do wyrejestrowania?', confirm: 'OK, udostępnij datę agentowi ZUS', processing: '', receipt: '', documents: ['Dane: tylko data zakończenia działalności', 'Odbiorca: agent ZUS', 'Cel: przygotowanie wyrejestrowania płatnika i właściciela z ubezpieczeń', 'Ta zgoda dotyczy sprawy; nie zastępuje urzędowej wymiany danych'] },
      { id: 'ceidg-plan', taskId: 'business-register', institution: 'Ministerstwo Rozwoju i Technologii', title: 'Wykreślenie firmy z CEIDG', kind: 'submit', offer: 'Wniosek o wykreślenie firmy jest gotowy. Mam Twoje dane i datę zakończenia: 28.10.2026. Dołączam też wyrejestrowanie właściciela z ubezpieczeń. Sprawdź podgląd i potwierdź.', confirm: 'Potwierdź wniosek o wykreślenie', processing: 'Przekazuję wniosek do CEIDG', receipt: 'Wniosek przyjęty. Firma została wykreślona z CEIDG, a data trafiła do ZUS. Wyrejestrowanie płatnika i właściciela mamy za sobą.', documents: ['CEIDG-1 — wykreślenie działalności', `Właściciel: ${scenario.profile.name}`, 'Data zakończenia działalności: 28.10.2026', 'Załącznik ZUS ZWUA: wyrejestrowanie właściciela z ubezpieczeń', 'Zgoda na przekazanie daty do ZUS: udzielona'] },
    ]
    if (employeeStatus === 'employs') steps.push({ id: 'employees-zus', taskId: 'social-insurance', institution: 'ZUS', title: 'Ubezpieczenia pracowników', kind: 'submit', offer: 'Zatrudniasz pracowników, więc samo wykreślenie firmy nie kończy ich ubezpieczeń. Mam przygotowany pakiet wyrejestrowań dla pracowników z listy płac. Potwierdzasz ten osobny krok?', confirm: 'Potwierdź wyrejestrowanie pracowników', processing: 'Przekazuję dokumenty do ZUS', receipt: 'Pakiet wyrejestrowań pracowników przyjęty w tej sprawie.', documents: ['ZUS ZWUA — pracownicy z przykładowej listy płac', 'ZUS ZCNA — zgłoszeni członkowie rodzin, jeżeli dotyczy', 'Lista osób i daty przekazane w sprawie'] })
    if (data.cash_register === 'online') steps.push({ id: 'cash-register-close', taskId: 'tax-office', institution: 'Urząd skarbowy', title: 'Zamknięcie kasy fiskalnej', kind: 'submit', offer: 'Kasa online też wymaga zamknięcia. Mam jej identyfikator z Twojej odpowiedzi. Potwierdź, a zakończę jej pracę i przekażę dokumenty rozliczenia.', confirm: 'Potwierdź zamknięcie kasy', processing: 'Zamykam kasę fiskalną', receipt: 'Kasa zamknięta i wyrejestrowana. Protokół i rozliczenie zapisane.', documents: ['Kasa: ' + data.cash_register_id, 'Firma: ' + data.company_name] })
    if (answerId === 'vat-yes') steps.push({ id: 'vat-plan', taskId: 'tax-office', institution: 'Urząd skarbowy', title: 'Zgłoszenie VAT-Z', kind: 'submit', offer: 'Zostało jeszcze VAT-Z. Mam już Twoje dane i datę z CEIDG, więc zgłoszenie zakończenia czynności objętych VAT jest gotowe. Przekazać je do urzędu skarbowego?', confirm: 'Potwierdź zgłoszenie VAT-Z', processing: 'Przekazuję VAT-Z do urzędu', receipt: 'VAT-Z przyjęte.', documents: ['Formularz VAT-Z', `Podatnik: ${scenario.profile.name}`, 'Data zakończenia czynności: 28.10.2026', 'Odbiorca: właściwy naczelnik urzędu skarbowego'] })
    return steps.map(step => equipStep(step, scenario, data, generated, origins))
  }
  const event = scenario.events.find(event => event.answerId === answerId)
  const ids = [...(event?.planItemIds ?? [])]
  if (scenario.id === 'support-benefit' && !ids.includes('support-application-plan')) ids.push('support-application-plan')
  return ids.map(id => {
    const plan = scenario.plan.find(plan => plan.id === id)!
    const task = scenario.tasks.find(task => task.id === plan.taskId)
    const copy = stepCopy[id]
    if (!task || !copy) throw new Error(`Missing authored flow step: ${scenario.id}/${id}`)
    let receipt = copy.receipt
    if (id === 'mpzp-plan') receipt = answerId === 'without-plan' ? 'Działka nie ma planu miejscowego. Najpierw przygotujemy wniosek o warunki zabudowy.' : 'Działka ma plan miejscowy. Nie potrzebujemy decyzji WZ; możemy zająć się pozwoleniem.'
    if (id === 'wzon-decision-plan') receipt = 'Ostateczna decyzja WZON wydana: 76 punktów. Przekazuję ją do dalszego kroku w ZUS.'
    return equipStep({ id, taskId: task.id, institution: task.institution, title: plan.title, kind: copy.kind ?? 'submit', offer: copy.offer, confirm: copy.confirm, receipt, next: copy.next, processing: copy.kind === 'check' ? 'Sprawdzam' : 'Przekazuję dokumenty', documents: copy.documents ?? plan.documents ?? [plan.title, `Osoba: ${scenario.profile.name}`, 'Dokument przygotowany z danych i plików przekazanych w sprawie'], unavailable: task.unavailable }, scenario, data, generated, origins)
  })
}

function equipStep(step: Omit<FlowStep, 'tools' | 'missingData' | 'dataSources'>, scenario: Scenario, data: Record<string, string>, generated: Record<string, string>, origins: Record<string, InputOrigin>): FlowStep {
  const date = data['closing-date'] ?? '28.10.2026'
  const personalize = (text: string) => text.replaceAll(scenario.profile.name, data.applicant_name ?? scenario.profile.name).replaceAll('28.10.2026', date).replaceAll('Jan Nowak', data.child?.split(',')[0] ?? 'Jan Nowak').replaceAll('24.10.2026', data.child?.split(',')[1]?.trim() ?? '24.10.2026')

  const context = { scenarioId: scenario.id, answerId: data.answer, employment: data.employment }
  const required = requiredStepFields(step.id, context)
  const values = { ...data, ...generated }
  const missingData = required.filter(key => !values[key]?.trim() || !origins[key] || !sourceAllowed(key, origins[key]) || (origins[key].kind === 'attachment' && !data[`file:${origins[key].reference}`]) || /\{[^}]+\}/.test(values[key]))
  const dataSources = required.filter(key => values[key]).map(field => ({ field, label: fieldLabel(field), value: values[field], source: origins[field]?.kind === 'attachment' ? `Załącznik: ${origins[field].reference}` : origins[field]?.kind === 'agent' ? `Potwierdzenie agenta: ${origins[field].reference}` : origins[field] ? 'Wiadomość użytkownika' : 'Brak potwierdzonego źródła' }))
  const documents = [...new Set([...step.documents.map(personalize), ...dataSources.map(source => `${source.label}: ${source.value}`)])]
  const scoped: Record<string, string> = Object.fromEntries(required.filter(key => values[key]).map(key => [key, values[key]]))
  for (const key of required) if (origins[key]?.kind === 'attachment') { const file = `file:${origins[key].reference}`; if (data[file]) scoped[file] = data[file] }
  // Branch selectors drive the local fixture but are not invented personal data.
  scoped.answer = data.answer
  if (data.employment) scoped.employment = data.employment
  return { ...step, kind: step.kind === 'consent' ? 'consent' : 'submit', processing: step.kind === 'consent' ? '' : 'Wykonuję potwierdzone działania', offer: personalize(step.offer), receipt: personalize(step.receipt), documents, missingData, dataSources, tools: mockToolsForStep(step.id, data.applicant_name ?? 'Nieprzekazane dane', scoped) }
}

const finalOutcomes: Record<string, string> = {
  'closing-business': 'Firma zamknięta, wyrejestrowania w CEIDG i ZUS zakończone, a wymagane rozliczenia zapisane.',
  'childbirth': 'Urodzenie zarejestrowane, akt i PESEL gotowe, meldunek zapisany, a 800+ przyznane i wypłata uruchomiona.',
  'buying-flat': 'Podatek rozliczony, własność wpisana do księgi wieczystej, a mieszkanie zgłoszone do gminy.',
  'building-house': 'Warunki dla działki ustalone, pozwolenie wydane, a rozpoczęcie robót zgłoszone. Formalności przed budową zakończone.',
  'bereavement': 'Zgon zarejestrowany, dokumenty gotowe, a zasiłek pogrzebowy rozliczony i wypłacony.',
  'inheritance': 'Dziedziczenie potwierdzone, podatek rozliczony, a własność mieszkania wpisana do księgi wieczystej.',
  'name-change': 'Dokumenty wymienione, dostarczone i zaktualizowane w rejestrach.',
  'moving-home': 'Meldunek zapisany, a powiązane dane adresowe zaktualizowane we wszystkich rejestrach tej sprawy.',
  'buying-car': 'PCC rozliczone i opłacone, samochód zarejestrowany, a dokumenty dostarczone.',
  'support-benefit': 'Ostateczna decyzja WZON jest gotowa, świadczenie wspierające przyznane, a wypłata uruchomiona.',
  'tax-summons': 'Odpowiedź złożona, dokumenty zweryfikowane, a wezwanie zamknięte przez urząd.',
  'unavailable-agent': 'Połączenie z ZUS odzyskane. Sprawy podatkowe i składkowe rozliczone i zamknięte.',
}
function finishText(scenario: Scenario) {
  return `Gotowe. ${finalOutcomes[scenario.id]} Nie masz już nic do zrobienia w tej sprawie. Potwierdzenia są w sprawie.`
}

export function initialFlow(scenario: Scenario, demo?: Case['demo'], fullRoute = false): FlowProjection {
  const questions = flowQuestions(scenario, undefined, undefined, {}, fullRoute)
  return { demo, fullRoute, phase: 'question', questionIndex: 0, questions, consent: false, steps: [], index: 0, completed: [], blocked: [], data: {}, origins: {}, generated: {}, attempts: {}, toolIndex: 0, messages: [
    { id: 'start-user', sender: 'Ty', text: scenario.id === 'bereavement' ? 'Zmarła bliska mi osoba. Potrzebuję pomocy z formalnościami.' : `Chcę ogarnąć: ${scenario.title.toLocaleLowerCase('pl')}.`, kind: 'text' },
    { id: 'question-0', sender: 'Ogarniacz', text: questions[0].text, kind: 'text' },
  ] }
}

function offer(flow: FlowProjection) {
  const step = flow.steps[flow.index]
  flow.phase = 'proposal'
  const previousOffers = flow.messages.filter(message => message.kind === 'offer')
  if (previousOffers.at(-1)?.sender !== step.institution) {
    const returning = previousOffers.some(message => message.sender === step.institution)
    flow.messages.push({ id: `calling-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'calling', target: step.institution, text: '' })
    flow.messages.push({ id: `joined-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'joined', target: step.institution, text: returning ? 'wraca do sprawy' : 'dołącza do sprawy' })
  }
  if (!flow.messages.some(message => message.kind === 'transferred' && message.transferStep === step.id)) {
    const sources = new Set(step.dataSources.map(source => flow.origins[source.field]).filter(origin => origin?.kind === 'agent').map(origin => origin.reference))
    for (const sourceId of sources) {
      const sourceStep = flow.steps.find(entry => entry.id === sourceId)
      if (!sourceStep || sourceStep.institution === step.institution || !flow.completed.includes(sourceId)) continue
      const labels = step.dataSources.filter(source => flow.origins[source.field]?.reference === sourceId).map(source => source.label)
      flow.messages.push({ id: `transferred-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'transferred', from: sourceStep.institution, target: step.institution, transferStep: step.id, text: labels.join(', ') })
    }
  }
  flow.messages.push({ id: `offer-${flow.messages.length}`, sender: step.institution, text: step.offer, kind: 'offer', step: step.id })
}
function next(flow: FlowProjection, scenario: Scenario) {
  flow.index++
  if (flow.index < flow.steps.length) offer(flow)
  else { flow.phase = 'done'; flow.messages.push({ id: `done-${flow.messages.length}`, sender: 'Ogarniacz', text: finishText(scenario), kind: 'text' }) }
}

function projectionSteps(flow: FlowProjection, scenario: Scenario) {
  const steps = buildFlowSteps(scenario, flow.answerId!, flow.employeeStatus, flow.data, flow.generated, flow.origins)
  if (flow.demo === 'timeline') {
    const permit = steps.find(step => step.id === 'permit-plan')
    if (permit) permit.tools = permit.tools.map((tool, index) => index === 1 ? { ...tool, name: 'construction.submit_building_permit', label: 'Składam wniosek o pozwolenie na budowę', output: { status: 'submitted', document: 'permit-plan', source: 'mock_mcp' } } : tool)
  }
  return steps
}

export function transitionFlow(before: FlowProjection, event: FlowEvent, scenario: Scenario): FlowProjection {
  const flow: FlowProjection = { ...before, messages: [...before.messages], completed: [...before.completed], blocked: [...before.blocked], data: { ...before.data }, origins: { ...before.origins }, generated: { ...before.generated }, attempts: { ...before.attempts } }
  const step = flow.steps[flow.index]
  const user = (text: string, attachments?: FlowAttachment[]) => flow.messages.push({ id: `user-${flow.messages.length}`, sender: 'Ty', text, kind: 'text', ...(attachments?.length ? { attachments } : {}) })
  if (event.kind === 'answer') {
    const question = flow.questions[flow.questionIndex]
    const option = question?.options.find(option => option.value === event.value)
    if (flow.phase !== 'question' || question.id !== event.question || !option) return before
    const attachments = resolveOptionAttachments(option, flow.data)
    user(resolveInputText(option.message ?? option.label, flow.data), attachments)
    const messageId = flow.messages[flow.messages.length - 1].id
    for (const [key, value] of Object.entries({ ...answerFields(question.id, option.value), ...(option.data ?? {}) })) {
      flow.data[key] = resolveInputText(value, flow.data)
      flow.origins[key] = { kind: 'message', reference: messageId }
    }
    for (const attachment of attachments) for (const [key, value] of Object.entries(attachment.data ?? {})) { flow.data[key] = value; flow.origins[key] = { kind: 'attachment', reference: attachment.name } }
    for (const attachment of attachments) { flow.data[`file:${attachment.name}`] = JSON.stringify({ name: attachment.name, mime: attachment.mime, fields: attachment.fields, provided_by: 'user_message' }); flow.origins[`file:${attachment.name}`] = { kind: 'attachment', reference: attachment.name } }
    if (attachments.length) {
      const fields = Object.fromEntries(attachments.flatMap(attachment => Object.entries(attachment.data ?? {}).map(([key, value]) => [fieldLabel(key), value])))
      flow.messages.push({ id: `extracted-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'extracted', text: `Ogarniacz odczytał ${attachments.length === 1 ? attachments[0].name : 'przesłane dokumenty'}`, fields })
    }
    if (question.id === 'employment') flow.employeeStatus = event.value as Case['employeeStatus']
    else if (question.id === 'answer') flow.answerId = event.value
    else flow.data[question.id] = event.value
    flow.origins[question.id] = { kind: 'message', reference: messageId }
    flow.questions = flowQuestions(scenario, flow.answerId, flow.employeeStatus, flow.data, flow.fullRoute)
    flow.questionIndex = flow.questions.findIndex(entry => entry.id === question.id) + 1
    if (flow.questionIndex < flow.questions.length) flow.messages.push({ id: `question-${flow.questionIndex}`, sender: 'Ogarniacz', text: flow.questions[flow.questionIndex].text, kind: 'text' })
    else { flow.steps = projectionSteps(flow, scenario); offer(flow) }
    return flow
  }
  if (!step || event.step !== step.id) return before
  const editable = flow.demo === 'correction' && scenario.id === 'buying-car' && step.id === 'car-pcc-plan'
  if (event.kind === 'edit' && flow.phase === 'proposal' && editable) {
    user('Chcę poprawić wartość auta przed wysłaniem.')
    flow.phase = 'editing'
    flow.messages.push({ id: `edit-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'text', text: 'Jasne. W tym przykładzie poprawiamy wartość rynkową auta na 24 000 zł. Przeliczę podatek i pokażę dokument przed wysłaniem.' })
    return flow
  }
  if (event.kind === 'correct' && flow.phase === 'editing' && editable) {
    user('Popraw wartość rynkową auta na 24 000 zł.')
    flow.data.vehicle_value = '24000'
    flow.origins.vehicle_value = { kind: 'message', reference: flow.messages.at(-1)!.id }
    flow.steps = projectionSteps(flow, scenario)
    flow.phase = 'proposal'
    flow.messages.push({ id: `correction-${flow.messages.length}`, sender: step.institution, kind: 'offer', step: step.id, text: 'Poprawiłem wartość auta na 24 000 zł. PCC wynosi teraz 480 zł. Dokument i płatność czekają na Twoje potwierdzenie.' })
    return flow
  }
  if (event.kind === 'cancel-edit' && flow.phase === 'editing' && editable) { user('Zostaw dotychczasowe dane.'); offer(flow); return flow }
  if (event.kind === 'advance-time' && flow.phase === 'waiting' && flow.demo === 'timeline' && step.id === 'permit-plan') {
    const pending = flow.messages.at(-1)!
    if (flow.timelineStage === 'sent') {
      flow.timelineStage = 'received'
      flow.messages.push({ ...pending, id: `delivery-${flow.messages.length}`, text: 'Wniosek doręczony do starostwa. Urząd go rozpatruje. Decyzji jeszcze nie ma — pilnuję tej sprawy za Ciebie.' })
    } else if (flow.timelineStage === 'received') {
      flow.timelineStage = 'decided'
      flow.phase = 'processing'
      flow.messages.push({ id: `time-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'timeskip', text: 'Później · skrócony czas oczekiwania w demonstracji' })
      flow.messages.push({ ...pending, id: `decision-${flow.messages.length}`, kind: 'processing', text: 'Odbieram decyzję urzędu.' })
    } else return before
    return flow
  }
  if (event.kind === 'pause' && (flow.phase === 'proposal' || (flow.phase === 'receipt' && flow.blocked.includes(step.id)))) { user('Nie teraz'); flow.phase = 'paused'; flow.messages.push({ id: `pause-${flow.messages.length}`, sender: 'Ogarniacz', text: 'Jasne, zatrzymujemy się tutaj. Niczego dalej nie przekazuję. Wrócimy do tego, kiedy zechcesz.', kind: 'text' }); return flow }
  if (event.kind === 'resume' && flow.phase === 'paused') { user('Wróćmy do tego'); offer(flow); return flow }
  if ((event.kind === 'confirm' && flow.phase === 'proposal') || (event.kind === 'retry' && flow.phase === 'receipt' && flow.blocked.includes(step.id))) {
    if (step.missingData.length) return before
    user(event.kind === 'retry' ? 'Spróbuj ponownie' : step.confirm)
    if (step.kind === 'consent') { flow.consent = true; flow.completed.push(step.id); next(flow, scenario) }
    else { flow.phase = 'processing'; flow.toolIndex = 0; flow.attempts[step.id] = (flow.attempts[step.id] ?? 0) + 1; flow.messages.push({ id: `response-${flow.messages.length}`, sender: step.institution, text: step.processing, kind: 'processing', step: step.id, attempt: flow.attempts[step.id], toolCount: 0 }) }
    return flow
  }
  const failedAttempt = step.unavailable && flow.attempts[step.id] === 1
  const timelinePending = flow.demo === 'timeline' && step.id === 'permit-plan' && flow.timelineStage !== 'decided'
  const toolLimit = failedAttempt ? 1 : step.tools.length - (timelinePending ? 1 : 0)
  if (event.kind === 'tool' && flow.phase === 'processing' && flow.toolIndex < toolLimit && step.tools[flow.toolIndex]?.name === event.tool) {
    flow.toolIndex++
    const message = flow.messages[flow.messages.length - 1]
    flow.messages[flow.messages.length - 1] = { ...message, toolCount: flow.toolIndex }
    return flow
  }
  if (event.kind === 'settled' && flow.phase === 'processing' && flow.toolIndex === toolLimit) {
    if (timelinePending) {
      flow.phase = 'waiting'
      flow.timelineStage = 'sent'
      const pending = flow.messages.at(-1)!
      flow.messages[flow.messages.length - 1] = { ...pending, kind: 'status', text: 'Wniosek o pozwolenie na budowę wysłany. To potwierdzenie wysłania, decyzji jeszcze nie ma. Dam znać, gdy urząd odbierze dokument.' }
      return flow
    }
    flow.phase = 'receipt'
    const pending = flow.messages[flow.messages.length - 1]
    flow.messages[flow.messages.length - 1] = { ...pending, kind: 'receipt', text: failedAttempt ? step.receipt : step.unavailable ? 'Połączenie odzyskane. Dokumenty przekazane, składki rozliczone, sprawa zamknięta.' : step.receipt }
    if (failedAttempt) { if (!flow.blocked.includes(step.id)) flow.blocked.push(step.id) }
    else { flow.blocked = flow.blocked.filter(id => id !== step.id); if (!flow.completed.includes(step.id)) flow.completed.push(step.id) }
    if (!failedAttempt) {
      for (const [key, value] of Object.entries(generatedByStep(step.id, flow.data))) { flow.generated[key] = value; flow.origins[key] = { kind: 'agent', reference: step.id } }
      flow.steps = projectionSteps(flow, scenario)
    }
    if (!failedAttempt && flow.blocked.length === 0 && flow.index === flow.steps.length - 1) {
      flow.phase = 'done'
      flow.messages.push({ id: `done-${flow.messages.length}`, sender: 'Ogarniacz', kind: 'text', text: finishText(scenario) })
    }
    return flow
  }
  if (event.kind === 'next' && flow.phase === 'receipt' && !flow.blocked.includes(step.id)) { next(flow, scenario); return flow }
  return before
}

export function projectFlow(current: Case): FlowProjection {
  const scenario = scenarios.find(scenario => scenario.id === current.scenarioId)!
  return (current.flow ?? []).reduce((flow, event) => transitionFlow(flow, event, scenario), initialFlow(scenario, current.demo, current.fullRoute))
}

export function applyFlowEvent(current: Case, event: FlowEvent): Case {
  const scenario = scenarios.find(scenario => scenario.id === current.scenarioId)!
  const before = projectFlow(current)
  const after = transitionFlow(before, event, scenario)
  if (after === before) return current
  const completedSteps = after.steps.filter(step => after.completed.includes(step.id) && step.kind !== 'consent')
  const completeTasks = new Set(completedSteps.map(step => step.taskId))
  if (scenario.id === 'closing-business' && after.completed.includes('ceidg-plan') && (after.employeeStatus !== 'employs' || after.completed.includes('employees-zus'))) completeTasks.add('social-insurance')
  const canonicalEvent = scenario.events.find(entry => entry.answerId === after.answerId)
  const history: HistoryEntry[] = [{ kind: 'started' }, ...after.messages.filter(message => message.sender === 'Ty' && message.id !== 'start-user').map(message => ({ kind: 'action' as const, label: message.text }))]
  const playbacks = [...completeTasks].map(taskId => ({ taskId, revealedSteps: scenario.tasks.find(task => task.id === taskId)!.playback.length }))
  const updated: Case = { ...current, flow: [...(current.flow ?? []), event], events: canonicalEvent ? [canonicalEvent] : [], employeeStatus: after.employeeStatus, consentGranted: after.consent, history, playbacks }
  if (scenario.id === 'closing-business' && after.completed.includes('ceidg-plan')) { updated.actionEvents = [{ type: 'ceidg-application-sent' }]; updated.transfer = { fromTaskId: 'business-register', toTaskId: 'social-insurance', resultId: 'ceidg', closingDate: after.data['closing-date'] ?? '28.10.2026' } }
  if (after.completed.includes('birth-plan')) updated.birthAction = 'sent'
  if (after.completed.includes('tax-summons-plan')) updated.taxReplyAction = 'sent'
  return updated
}

export function validFlowEvents(current: Case): boolean {
  try {
    if (!Array.isArray(current.flow) || current.flow.length > 500) return false
    const scenario = scenarios.find(scenario => scenario.id === current.scenarioId)
    if (!scenario || (current.demo === 'correction' && scenario.id !== 'buying-car') || (current.demo === 'timeline' && scenario.id !== 'building-house')) return false
    let flow = initialFlow(scenario, current.demo, current.fullRoute)
    for (const event of current.flow) {
      if (!event || typeof event !== 'object') return false
      const next = transitionFlow(flow, event, scenario)
      if (next === flow) return false
      flow = next
    }
    return true
  } catch { return false }
}
