import type { FlowEvent } from './flow'
type EmployeeStatus = 'employs' | 'does-not-employ'
type AnswerId = string
type TaskId = string
type ResultId = string
type PlanItemId = string

type Source = {
  institution: string
  title?: string
  url: string
  updatedAt?: string
  publishedAt?: string
  updateNote?: string
  checkedAt: string
}

type ScenarioEvent = {
  id: string
  type: 'answer-selected'
  answerId: AnswerId
  planItemIds: PlanItemId[]
}

type PlaybackStep =
  | { kind: 'message'; text: string }
  | { kind: 'tool-call'; name: string; input: string }
  | { kind: 'tool-result'; resultId: ResultId }
  | { kind: 'complete' }

type Task = {
  id: TaskId
  institution: string
  capabilities: string[]
  description: string
  followUp?: string
  dependency?: { taskId: TaskId; resultId: ResultId; recipient: string; purpose: string }
  playback: PlaybackStep[]
  summary?: string
  unavailable?: boolean
}

type Result = {
  id: ResultId
  text: string
  source: Source
  additionalSources?: Source[]
  closingDate?: string
  caseText?: string
}

type PlanItem = {
  id: PlanItemId
  title: string
  taskId: TaskId
  resultId: ResultId
  note?: string
  documents?: string[]
  nextSteps?: { text: string; employeeStatus?: EmployeeStatus; unansweredText?: string }[]
  dependencyNote?: string
}

type Scenario = {
  id: string
  title: string
  profile: { name: string; business: string }
  assumptions: string[]
  question: string
  answers: { id: AnswerId; label: string; explanation?: string }[]
  employmentQuestion?: string
  employmentAnswers?: { status: EmployeeStatus; label: string }[]
  summary?: string
  scopeNote?: string
  events: ScenarioEvent[]
  tasks: Task[]
  results: Result[]
  plan: PlanItem[]
}

export const ceidgSentStatus = 'Wniosek oznaczony jako wysłany. Doręczenie i rozpatrzenie nie są potwierdzone.'
export const birthSentStatus = 'Wysłano zgłoszenie. Doręczenie i rejestracja nie są jeszcze potwierdzone.'

const taxGuide: Source = {
  institution: 'Ministerstwo Finansów',
  url: 'https://podatki.gov.pl/poradniki-i-informatory/zakonczenie-dzialalnosci-gospodarczej',
  updatedAt: '26.05.2026',
  checkedAt: '2026-10-30',
}

const zusGuide: Source = {
  institution: 'ZUS',
  title: 'wyrejestrowanie płatnika',
  url: 'https://www.zus.pl/-/wyrejestrowanie-platnika-podlegajacego-wpisowi-do-ceidg',
  updatedAt: 'nie podano',
  checkedAt: '2026-10-30',
}

const zusInsuredGuide: Source = {
  institution: 'ZUS',
  title: 'wyrejestrowanie ubezpieczonego i członka rodziny',
  url: 'https://www.zus.pl/pl/firmy/wyrejestrowanie-platnika/firmy/wyrejestrowanie-ubezpieczonego/czlonka-rodziny',
  updatedAt: 'nie podano',
  publishedAt: '12.03.2026',
  checkedAt: '2026-10-30',
}

const pccGuide: Source = {
  institution: 'Ministerstwo Finansów',
  url: 'https://www.gov.pl/web/gov/zaplac-podatek-od-czynnosci-cywilnoprawnych/',
  checkedAt: '2026-10-30',
}

const notaryGuide: Source = {
  institution: 'Ministerstwo Sprawiedliwości — Prawo o notariacie',
  url: 'https://eli.gov.pl/eli/DU/2026/614/ogl',
  checkedAt: '2026-10-30',
}

const in1Guide: Source = {
  institution: 'Ministerstwo Finansów',
  url: 'https://www.podatki.gov.pl/media/p1mj4d0h/in1-01-23.pdf',
  checkedAt: '2026-10-30',
}

const permitGuide: Source = {
  institution: 'Ministerstwo Rozwoju i Technologii',
  url: 'https://www.gov.pl/web/gov/uzyskaj-zgode-na-budowe-domu',
  checkedAt: '2026-10-30',
}

const planningGuide: Source = {
  institution: 'Biznes.gov.pl — Ministerstwo Rozwoju i Technologii',
  url: 'https://www.biznes.gov.pl/pl/portal/ou430',
  checkedAt: '2026-10-30',
}

const noticeGuide: Source = {
  institution: 'Główny Urząd Nadzoru Budowlanego',
  url: 'https://www.gov.pl/web/gunb/procedury-budowlane',
  checkedAt: '2026-10-30',
}

export const closingBusiness: Scenario = {
  id: 'closing-business',
  title: 'Zamknięcie firmy',
  profile: { name: 'Marta Nowak', business: 'Jednoosobowa działalność gospodarcza' },
  assumptions: ['Chcesz zamknąć firmę na stałe. Przejdźmy przez formalności po kolei.'],
  question: 'Czy jesteś czynnym podatnikiem VAT?',
  answers: [
    { id: 'vat-yes', label: 'Tak, jestem czynnym podatnikiem VAT' },
    { id: 'vat-no', label: 'Nie jestem czynnym podatnikiem VAT' },
  ],
  employmentQuestion: 'Czy zatrudniasz pracowników?',
  employmentAnswers: [
    { status: 'employs', label: 'Tak, zatrudniam pracowników' },
    { status: 'does-not-employ', label: 'Nie zatrudniam pracowników' },
  ],
  events: [
    { id: 'vat-answer-yes', type: 'answer-selected', answerId: 'vat-yes', planItemIds: ['vat-plan', 'ceidg-plan', 'zus-plan'] },
    { id: 'vat-answer-no', type: 'answer-selected', answerId: 'vat-no', planItemIds: ['ceidg-plan', 'zus-plan'] },
  ],
  tasks: [
    {
      id: 'tax-office', institution: 'Urząd skarbowy', capabilities: ['Informacje o zgłoszeniu VAT-Z'],
      description: 'Informacja o zgłoszeniu VAT-Z',
      playback: [
        { kind: 'message', text: 'Sprawdzam informacje o zgłoszeniu VAT-Z.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o VAT-Z', input: 'Zapytanie: zgłoszenie VAT-Z przy zakończeniu działalności' },
        { kind: 'tool-result', resultId: 'vat-z' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'business-register', institution: 'Ministerstwo Rozwoju i Technologii', capabilities: ['Informacje o wykreśleniu z CEIDG'],
      description: 'Informacja o wykreśleniu z CEIDG',
      playback: [
        { kind: 'message', text: 'Sprawdzam informacje o wykreśleniu z CEIDG.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o CEIDG', input: 'Zapytanie: wykreślenie z CEIDG przy zakończeniu działalności' },
        { kind: 'tool-result', resultId: 'ceidg' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'social-insurance', institution: 'ZUS', capabilities: ['Informacje o wyrejestrowaniu płatnika składek'],
      description: 'Informacja o wyrejestrowaniu płatnika składek',
      dependency: {
        taskId: 'business-register',
        resultId: 'ceidg',
        recipient: 'ZUS',
        purpose: 'Wyjaśnienie wyrejestrowania płatnika składek',
      },
      playback: [
        { kind: 'message', text: 'Potrzebuję daty zakończenia działalności z CEIDG, aby wyjaśnić wyrejestrowanie płatnika.' },
        { kind: 'message', text: 'Mam już datę z CEIDG: {closingDate}. Sprawdzę, co dalej ze składkami.' },
        { kind: 'tool-call', name: 'Informacja o wyrejestrowaniu płatnika', input: 'Data zakończenia działalności z CEIDG: {closingDate}' },
        { kind: 'tool-result', resultId: 'zus-payer' },
        { kind: 'complete' },
      ],
    },
  ],
  results: [{
    id: 'vat-z',
    text: 'Jeśli kończysz wykonywanie czynności objętych VAT, potrzebujesz formularza VAT-Z. Przekaż go naczelnikowi urzędu skarbowego w ciągu 7 dni od zakończenia tych czynności.',
    source: taxGuide,
  }, {
    id: 'ceidg',
    text: 'Firmę wykreślisz z CEIDG, składając wniosek. Masz na to 7 dni od dnia, w którym faktycznie przestajesz prowadzić działalność.',
    source: taxGuide,
    closingDate: '28.10.2026',
  }, {
    id: 'zus-payer',
    text: 'ZUS wyrejestruje płatnika składek na podstawie danych z CEIDG. Jest jeszcze jedna rzecz: osobę ubezpieczoną trzeba wyrejestrować osobno. Jako przedsiębiorca możesz zgłosić to razem z wnioskiem o wykreślenie z CEIDG.',
    caseText: 'Sprawdziłem to dla daty zakończenia działalności {closingDate}.',
    source: zusGuide,
    additionalSources: [zusInsuredGuide],
  }],
  plan: [
    { id: 'vat-plan', title: 'Zgłoszenie VAT-Z', taskId: 'tax-office', resultId: 'vat-z' },
    { id: 'ceidg-plan', title: 'Wykreślenie z CEIDG', taskId: 'business-register', resultId: 'ceidg', documents: ['Wniosek CEIDG-1 o wykreślenie wpisu.'], nextSteps: [{ text: 'Jeśli korzystałeś z kasy fiskalnej, z serwisantem zakończ jej pracę i sprawdź tryb właściwy dla typu urządzenia. Po odczycie złóż wniosek o wyrejestrowanie kasy z protokołem i raportem fiskalnym do właściwego urzędu skarbowego w ciągu 5 dni od ich sporządzenia. Dla kasy online zapewnij również odczyt i zapis danych z pamięci chronionej na nośnik zewnętrzny.' }] },
    {
      id: 'zus-plan', title: 'Wyrejestrowanie płatnika składek', taskId: 'social-insurance', resultId: 'zus-payer',
      dependencyNote: 'To działanie zależy od daty zakończenia działalności ustalonej w CEIDG.',
      nextSteps: [
        { text: 'Sprawdź, czy razem z CEIDG-1 zgłosiłeś wyrejestrowanie siebie z ubezpieczeń na formularzu ZUS ZWUA. Jeśli nie, złóż ZUS ZWUA w ciągu 7 dni od daty ustania tytułu do ubezpieczeń.' },
        { text: 'Wyrejestruj pracowników z ubezpieczeń na formularzu ZUS ZWUA w ciągu 7 dni od daty ustania obowiązku ubezpieczeń.', employeeStatus: 'employs', unansweredText: 'Jeśli zatrudniasz pracowników, wyrejestruj ich z ubezpieczeń na formularzu ZUS ZWUA w ciągu 7 dni od daty ustania obowiązku ubezpieczeń.' },
        { text: 'Jeśli zgłaszałeś członków rodziny pracowników do ubezpieczenia zdrowotnego, wyrejestruj ich na formularzu ZUS ZCNA w ciągu 7 dni od daty ustania obowiązku ubezpieczenia.', employeeStatus: 'employs', unansweredText: 'Jeśli zgłaszałeś członków rodziny pracowników do ubezpieczenia zdrowotnego, wyrejestruj ich na formularzu ZUS ZCNA w ciągu 7 dni od daty ustania obowiązku ubezpieczenia.' },
        { text: 'Jeśli zgłosiłeś członka rodziny do ubezpieczenia zdrowotnego, wyrejestruj go na formularzu ZUS ZCNA w ciągu 7 dni od daty ustania Twojego tytułu do ubezpieczeń.' },
      ],
    },
  ],
}

export const childbirth: Scenario = {
  id: 'childbirth',
  title: 'Narodziny dziecka',
  profile: { name: 'Anna Nowak', business: 'Mama Jana' },
  assumptions: ['Jan Nowak urodził się 24.10.2026 w Warszawie. Karta urodzenia została sporządzona 25.10.2026 i przekazana do USC przez osobę odbierającą poród. Anna jest matką dziecka i ma pełną zdolność do czynności prawnych.'],
  question: 'Co chcesz zrobić?',
  answers: [{ id: 'register-birth', label: 'Chcę zgłosić urodzenie dziecka' }],
  events: [{ id: 'birth-answer', type: 'answer-selected', answerId: 'register-birth', planItemIds: ['birth-plan', 'benefit-plan'] }],
  tasks: [
    {
      id: 'civil-registry', institution: 'Urząd stanu cywilnego', capabilities: ['Rejestracja urodzenia'],
      description: 'Informacja o zgłoszeniu i rejestracji urodzenia',
      summary: 'USC wyjaśnił, jak zgłosić urodzenie oraz jakie czynności następują przy rejestracji.',
      playback: [
        { kind: 'message', text: 'Sprawdzam zasady rejestracji urodzenia.' },
        { kind: 'message', text: 'Rozróżniam zgłoszenie rodzica od czynności kierownika USC.' },
        { kind: 'tool-call', name: 'Informacja o rejestracji urodzenia', input: 'Zapytanie: zgłoszenie urodzenia dziecka w Polsce' },
        { kind: 'tool-result', resultId: 'birth-registration' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'family-benefits', institution: 'ZUS', capabilities: ['Informacje o świadczeniu 800+'],
      description: 'Informacja o wniosku o 800+',
      summary: 'Agent ZUS wskazał osobny wniosek oraz termin ważny dla świadczenia od narodzin.',
      playback: [
        { kind: 'message', text: 'Sprawdzam zasady wniosku o 800+ dla nowo narodzonego dziecka.' },
        { kind: 'message', text: 'Sprawdzam termin i sposób złożenia wniosku.' },
        { kind: 'tool-call', name: 'Informacja o 800+', input: 'Zapytanie: wniosek rodzica na nowo narodzone dziecko' },
        { kind: 'tool-result', resultId: 'child-benefit' },
        { kind: 'complete' },
      ],
    },
  ],
  results: [
    {
      id: 'birth-registration',
      text: 'Zgłoś urodzenie w USC właściwym dla miejsca urodzenia w ciągu 21 dni od sporządzenia karty urodzenia.',
      caseText: 'Po zgłoszeniu i otrzymaniu karty kierownik USC sporządzi akt urodzenia; przy rejestracji dziecko otrzyma PESEL i zostanie zameldowane, jeśli spełnione są warunki. Nie składaj osobnych zgłoszeń tylko po to, by uzyskać te czynności.',
      source: { institution: 'Gov.pl — zgłoszenie urodzenia', url: 'https://www.gov.pl/web/gov/zglos-urodzenie-dziecka', checkedAt: '2026-10-30' },
    },
    {
      id: 'child-benefit',
      text: 'O 800+ trzeba zawnioskować osobno do ZUS. Jeśli złożysz wniosek w ciągu 3 miesięcy od urodzenia dziecka i spełnisz warunki, świadczenie będzie przysługiwać od dnia narodzin.',
      caseText: 'Przygotuj dane dziecka i numer rachunku. Wniosek SW-R wyślesz elektronicznie — przez eZUS, mZUS, Emp@tię albo bankowość elektroniczną.',
      source: { institution: 'ZUS — 800+', url: 'https://www.zus.pl/en/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus', checkedAt: '2026-10-30' },
    },
  ],
  plan: [
    { id: 'birth-plan', title: 'Zgłoszenie urodzenia', taskId: 'civil-registry', resultId: 'birth-registration' },
    { id: 'benefit-plan', title: 'Wniosek o 800+', taskId: 'family-benefits', resultId: 'child-benefit' },
  ],
}

export const buyingFlat: Scenario = {
  id: 'buying-flat',
  title: 'Kupno mieszkania',
  summary: 'Domknij formalności po zakupie: podatek, księga wieczysta i zgłoszenie do gminy.',
  profile: { name: 'Anna Kowalska', business: 'Zakup mieszkania' },
  assumptions: [
    'Anna właśnie kupuje mieszkanie i chce domknąć formalności po zakupie.',
    'Sprawdzamy wyłącznie czynności po zakupie. Negocjacje, kredyt i remont nie są częścią tej sprawy.',
  ],
  scopeNote: 'Zakres: PCC (jeśli dotyczy), wpis własności w księdze wieczystej i zgłoszenie nieruchomości do podatku od nieruchomości.',
  question: 'Jak kupujesz mieszkanie?',
  answers: [
    {
      id: 'secondary-market',
      label: 'Rynek wtórny — kupuję aktem notarialnym',
      explanation: 'Przy zakupie na rynku wtórnym aktem notarialnym PCC pobiera notariusz. Nie składasz odrębnego PCC-3. Sprawdzam wpis w księdze wieczystej i zgłoszenie do gminy.',
    },
    {
      id: 'developer-market',
      label: 'Od dewelopera — umowa w formie aktu notarialnego',
      explanation: 'Zakup od dewelopera jest opodatkowany VAT, więc nie płacisz PCC od tej umowy. Sprawdzam wpis w księdze wieczystej i zgłoszenie do gminy.',
    },
  ],
  events: [
    { id: 'secondary-answer', type: 'answer-selected', answerId: 'secondary-market', planItemIds: ['pcc-plan', 'kw-plan', 'in1-plan'] },
    { id: 'developer-answer', type: 'answer-selected', answerId: 'developer-market', planItemIds: ['kw-plan', 'in1-plan'] },
  ],
  tasks: [
    {
      id: 'flat-tax', institution: 'Urząd skarbowy', capabilities: ['Informacja o PCC przy zakupie mieszkania'],
      description: 'Informacja o podatku PCC',
      followUp: 'Urząd wyjaśnił, że przy akcie notarialnym PCC pobiera notariusz.',
      playback: [
        { kind: 'message', text: 'Sprawdzam, czy przy tym zakupie powstaje obowiązek PCC.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o PCC', input: 'Zapytanie: PCC przy zakupie mieszkania aktem notarialnym' },
        { kind: 'tool-result', resultId: 'pcc' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'flat-court', institution: 'Sąd rejonowy — wydział ksiąg wieczystych', capabilities: ['Informacja o wpisie własności do księgi wieczystej'],
      description: 'Informacja o wpisie własności do księgi wieczystej',
      followUp: 'Sąd przypomniał, że wniosek o wpis składa notariusz, a Ty nie składasz go odrębnie.',
      playback: [
        { kind: 'message', text: 'Sprawdzam, kto składa wniosek o wpis własności do księgi wieczystej.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o wpisie w księdze wieczystej', input: 'Zapytanie: wpis własności po akcie notarialnym' },
        { kind: 'tool-result', resultId: 'kw' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'flat-commune', institution: 'Urząd gminy', capabilities: ['Informacja o podatku od nieruchomości'],
      description: 'Informacja o zgłoszeniu nieruchomości do podatku',
      followUp: 'Gmina wskazała termin złożenia informacji o nieruchomości.',
      playback: [
        { kind: 'message', text: 'Sprawdzam obowiązek zgłoszenia mieszkania do podatku od nieruchomości.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o podatku od nieruchomości', input: 'Zapytanie: zgłoszenie nieruchomości po zakupie mieszkania' },
        { kind: 'tool-result', resultId: 'in1' },
        { kind: 'complete' },
      ],
    },
  ],
  results: [{
    id: 'pcc',
    text: 'Przy zakupie mieszkania na rynku wtórnym w formie aktu notarialnego PCC wynosi 2% wartości rynkowej. Podatek pobiera i wpłaca notariusz, więc nie składasz odrębnego zgłoszenia PCC-3.',
    source: pccGuide,
  }, {
    id: 'kw',
    text: 'Notariusz sporządzający akt przenoszący własność składa wniosek o wpis do księgi wieczystej za pośrednictwem systemu teleinformatycznego nie później niż w dniu sporządzenia aktu. Nie składasz odrębnego wniosku. Opłatę sądową za wpis notariusz pobiera od wnioskodawcy.',
    source: notaryGuide,
  }, {
    id: 'in1',
    text: 'Jako właściciel mieszkania złóż informację IN-1 do organu podatkowego gminy w ciągu 14 dni od nabycia nieruchomości. Informację składasz także wtedy, gdy nieruchomość jest zwolniona z podatku.',
    source: in1Guide,
  }],
  plan: [
    { id: 'pcc-plan', title: 'Podatek PCC', taskId: 'flat-tax', resultId: 'pcc', note: 'Tylko przy zakupie na rynku wtórnym. PCC pobiera notariusz.' },
    { id: 'kw-plan', title: 'Wpis własności w księdze wieczystej', taskId: 'flat-court', resultId: 'kw', note: 'Wniosek składa notariusz; nie składasz go odrębnie.' },
    { id: 'in1-plan', title: 'Zgłoszenie nieruchomości do gminy', taskId: 'flat-commune', resultId: 'in1', note: 'Informacja IN-1 w ciągu 14 dni od nabycia.' },
  ],
}

export const buildingHouse: Scenario = {
  id: 'building-house',
  title: 'Budowa domu',
  summary: 'Przygotuj pozwolenie na budowę domu i zgłoszenie rozpoczęcia robót.',
  profile: { name: 'Piotr Zieliński', business: 'Budowa domu jednorodzinnego' },
  assumptions: [
    'Piotr przygotowuje budowę domu jednorodzinnego o powierzchni zabudowy 140 m².',
    'To krótki etap: kończy się na pozwoleniu na budowę i zawiadomieniu o rozpoczęciu robót. Projekt, sama budowa i odbiór to osobne etapy.',
  ],
  scopeNote: 'Zakres: przygotowanie i uzyskanie pozwolenia na budowę oraz zawiadomienie o rozpoczęciu robót. Nie obejmuje całej budowy ani odbioru domu.',
  question: 'Czy działka jest objęta miejscowym planem zagospodarowania przestrzennego?',
  answers: [
    {
      id: 'with-plan',
      label: 'Tak, działka jest objęta planem miejscowym',
      explanation: 'Działka jest objęta planem miejscowym, więc nie potrzebujesz decyzji o warunkach zabudowy. Przechodzę do pozwolenia na budowę.',
    },
    {
      id: 'without-plan',
      label: 'Nie, działka nie jest objęta planem miejscowym',
      explanation: 'Brak planu miejscowego oznacza, że najpierw potrzebna jest decyzja o warunkach zabudowy. To osobny wniosek do gminy, zanim złożysz wniosek o pozwolenie na budowę.',
    },
  ],
  events: [
    { id: 'with-plan-answer', type: 'answer-selected', answerId: 'with-plan', planItemIds: ['mpzp-plan', 'permit-plan', 'notice-plan'] },
    { id: 'without-plan-answer', type: 'answer-selected', answerId: 'without-plan', planItemIds: ['mpzp-plan', 'wz-plan', 'permit-plan', 'notice-plan'] },
  ],
  tasks: [
    {
      id: 'commune-plan', institution: 'Urząd gminy', capabilities: ['Informacja o planie miejscowym'],
      description: 'Sprawdzenie planu miejscowego',
      followUp: 'Gmina potwierdziła, że status planu miejscowego decyduje o potrzebie decyzji WZ.',
      playback: [
        { kind: 'message', text: 'Sprawdzam w gminie, czy działka jest objęta planem miejscowym.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie planu miejscowego', input: 'Zapytanie: MPZP dla działki 123/4, gmina Przykładowo' },
        { kind: 'tool-result', resultId: 'mpzp-check' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'commune-wz', institution: 'Urząd gminy', capabilities: ['Informacja o warunkach zabudowy'],
      description: 'Informacja o decyzji o warunkach zabudowy',
      followUp: 'Gmina wyjaśniła, że decyzja WZ jest potrzebna tylko poza planem miejscowym.',
      playback: [
        { kind: 'message', text: 'Sprawdzam warunki i termin wydania decyzji o warunkach zabudowy.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie informacji o warunkach zabudowy', input: 'Zapytanie: decyzja WZ dla działki 123/4' },
        { kind: 'tool-result', resultId: 'wz' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'starosta', institution: 'Starosta', capabilities: ['Informacja o pozwoleniu na budowę'],
      description: 'Informacja o pozwoleniu na budowę',
      followUp: 'Starosta wskazał dokumenty i termin wydania decyzji o pozwoleniu na budowę.',
      playback: [
        { kind: 'message', text: 'Sprawdzam wymagane dokumenty i termin pozwolenia na budowę.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie wymagań pozwolenia na budowę', input: 'Zapytanie: pozwolenie na budowę domu jednorodzinnego' },
        { kind: 'tool-result', resultId: 'permit' },
        { kind: 'complete' },
      ],
    },
    {
      id: 'building-inspector', institution: 'Powiatowy inspektorat nadzoru budowlanego', capabilities: ['Informacja o zawiadomieniu o rozpoczęciu robót'],
      description: 'Informacja o zawiadomieniu o rozpoczęciu robót',
      followUp: 'Nadzór budowlany przypomniał, że zawiadomienie nie jest wnioskiem o pozwolenie.',
      playback: [
        { kind: 'message', text: 'Sprawdzam, jak zgłosić rozpoczęcie robót.' },
        { kind: 'message', text: 'Jeszcze sprawdzę szczegóły.' },
        { kind: 'tool-call', name: 'Sprawdzenie zawiadomienia o rozpoczęciu robót', input: 'Zapytanie: zawiadomienie PINB przed rozpoczęciem robót' },
        { kind: 'tool-result', resultId: 'notice' },
        { kind: 'complete' },
      ],
    },
  ],
  results: [{
    id: 'mpzp-check',
    text: 'Sprawdź w gminie, czy działka jest objęta miejscowym planem zagospodarowania przestrzennego. Jeżeli plan obowiązuje, nie musisz składać dodatkowych dokumentów planistycznych. Jeżeli planu nie ma, potrzebujesz decyzji o warunkach zabudowy.',
    source: permitGuide,
  }, {
    id: 'wz',
    text: 'Decyzję o warunkach zabudowy wydaje wójt, burmistrz albo prezydent miasta. Wniosek składasz tylko wtedy, gdy działka nie jest objęta miejscowym planem zagospodarowania przestrzennego. Dla inwestycji innej niż dom jednorodzinny do 70 m² powierzchni zabudowy organ ma do 90 dni na wydanie decyzji.',
    source: planningGuide,
  }, {
    id: 'permit',
    text: 'Wniosek o pozwolenie na budowę domu jednorodzinnego składasz do starosty, a w miastach na prawach powiatu — do urzędu miasta. Do wniosku dołączasz projekt zagospodarowania działki, projekt architektoniczno-budowlany, oświadczenie o prawie do dysponowania nieruchomością na cele budowlane oraz decyzję o warunkach zabudowy, jeśli działka nie jest objęta planem miejscowym. Organ ma do 65 dni na wydanie decyzji.',
    source: permitGuide,
  }, {
    id: 'notice',
    text: 'Przed rozpoczęciem robót zawiadom właściwy powiatowy inspektorat nadzoru budowlanego o zamierzonym terminie ich rozpoczęcia. Zawiadomienie nie jest wnioskiem o pozwolenie i nie czekasz na decyzję. Geodeta wytycza budynek na działce przed rozpoczęciem robót.',
    source: noticeGuide,
  }],
  plan: [
    { id: 'mpzp-plan', title: 'Sprawdzenie planu miejscowego', taskId: 'commune-plan', resultId: 'mpzp-check', note: 'Status planu decyduje, czy potrzebna jest decyzja WZ.' },
    { id: 'wz-plan', title: 'Warunki zabudowy', taskId: 'commune-wz', resultId: 'wz', note: 'Tylko wtedy, gdy działka nie jest objęta planem miejscowym.' },
    { id: 'permit-plan', title: 'Pozwolenie na budowę', taskId: 'starosta', resultId: 'permit', note: 'Po ustaleniu planu miejscowego; termin do 65 dni.' },
    { id: 'notice-plan', title: 'Zawiadomienie o rozpoczęciu robót', taskId: 'building-inspector', resultId: 'notice', note: 'Przed rozpoczęciem robót; to nie jest wniosek o pozwolenie.' },
  ],
}

// These short scenarios contain information, not a determination of an individual's entitlement.
const deathRegistration: Result = {
  id: 'death-registration',
  text: 'Zgłoś zgon w USC właściwym dla miejsca zgonu przed pogrzebem. Przygotuj kartę zgonu i dokumenty tożsamości. Termin wynosi 3 dni od wystawienia karty, a przy chorobie zakaźnej 24 godziny od zgonu. Po rejestracji otrzymasz bezpłatny odpis skrócony aktu zgonu.',
  source: { institution: 'Gov.pl', url: 'https://www.gov.pl/web/gov/zglos-zgon', checkedAt: '2026-10-30' },
}
const funeralBenefit: Result = {
  id: 'funeral-benefit',
  text: 'Jeśli ponosisz koszty pogrzebu i spełnione są warunki zasiłku, złóż w ZUS wniosek Z-12 i rachunki. Co do zasady masz 12 miesięcy od śmierci; przy przeszkodach niezależnych od Ciebie termin może biec od pogrzebu.',
  source: { institution: 'ZUS', url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-pogrzebowy', checkedAt: '2026-10-30' },
}

function informationTask(id: TaskId, institution: string, description: string, result: Result): Task {
  return {
    id, institution, description, capabilities: [description],
    playback: [
      { kind: 'message', text: 'Sprawdzam informacje potrzebne do planu.' },
      { kind: 'tool-call', name: description, input: `Zapytanie: ${description}` },
      { kind: 'tool-result', resultId: result.id },
      { kind: 'complete' },
    ],
  }
}

export const bereavement: Scenario = {
  id: 'bereavement', title: 'Śmierć bliskiej osoby',
  summary: 'Uporządkuj formalności po zgłoszeniu zgonu i sprawdź zasiłek pogrzebowy.',
  profile: { name: 'Marta Nowak', business: 'Formalności po śmierci bliskiej osoby' },
  assumptions: ['Przykro mi z powodu Twojej straty. Uporządkujmy spokojnie najbliższe formalności. Marta organizuje pogrzeb bliskiej osoby.'],
  question: 'Czy zgon został już zgłoszony w urzędzie stanu cywilnego?',
  answers: [
    { id: 'death-not-registered', label: 'Zgon nie został jeszcze zgłoszony' },
    { id: 'death-registered', label: 'Zgon został już zgłoszony' },
  ],
  events: [
    { id: 'death-not-registered', type: 'answer-selected', answerId: 'death-not-registered', planItemIds: ['death-registration-plan', 'funeral-benefit-plan'] },
    { id: 'death-registered', type: 'answer-selected', answerId: 'death-registered', planItemIds: ['funeral-benefit-plan'] },
  ],
  tasks: [
    informationTask('civil-registry', 'Urząd stanu cywilnego', 'Informacja o zgłoszeniu zgonu', deathRegistration),
    informationTask('funeral-zus', 'ZUS', 'Informacja o zasiłku pogrzebowym', funeralBenefit),
  ],
  results: [deathRegistration, funeralBenefit],
  plan: [
    { id: 'death-registration-plan', title: 'Zgłoszenie zgonu', taskId: 'civil-registry', resultId: deathRegistration.id },
    { id: 'funeral-benefit-plan', title: 'Zasiłek pogrzebowy', taskId: 'funeral-zus', resultId: funeralBenefit.id },
  ],
}

const inheritanceStatement: Result = {
  id: 'inheritance-statement',
  text: 'Spadek obejmuje także długi. Oświadczenie o przyjęciu albo odrzuceniu całego spadku możesz złożyć w ciągu 6 miesięcy od dnia, w którym dowiesz się o tytule powołania. Oświadczenie składa się przed sądem albo notariuszem. Brak oświadczenia w terminie oznacza co do zasady przyjęcie z dobrodziejstwem inwentarza.',
  source: { institution: 'Sąd rejonowy — sprawy spadkowe', title: 'Kodeks cywilny, art. 1012–1018', url: 'https://eli.gov.pl/api/acts/DU/2025/1071/text/T/D20251071L.pdf', publishedAt: '18.08.2025', checkedAt: '2026-11-02' },
}
const inheritanceConfirmation: Result = {
  id: 'inheritance-confirmation',
  text: 'Przygotuj odpis aktu zgonu, dokumenty potwierdzające pokrewieństwo i ewentualny testament. Możesz złożyć wniosek o stwierdzenie nabycia spadku do sądu spadku albo, w odpowiednich przypadkach, uzyskać poświadczenie dziedziczenia u notariusza.',
  source: { institution: 'Sąd Rejonowy w Limanowej', url: 'https://limanowa.sr.gov.pl/%2Cnew%2Cm3%2C31.html%2C237', checkedAt: '2026-10-30' },
}
const inheritanceTax: Result = {
  id: 'inheritance-tax',
  text: 'Jako córka spadkodawcy możesz skorzystać ze zwolnienia dla najbliższej rodziny. Jeżeli wymagane jest zgłoszenie SD-Z2, złóż je w ciągu 6 miesięcy od uprawomocnienia postanowienia sądu albo zarejestrowania aktu poświadczenia dziedziczenia. Sprawdź warunki i wyjątki od zgłoszenia.',
  source: { institution: 'Ministerstwo Finansów', url: 'https://podatki.gov.pl/podatki-osobiste/sd/ulgi-i-zwolnienia', checkedAt: '2026-10-30' },
}
const landRegister: Result = {
  id: 'land-register',
  text: 'Po potwierdzeniu dziedziczenia przygotuj wniosek KW-WPIS do sądu prowadzącego księgę wieczystą mieszkania oraz dokument stanowiący podstawę wpisu, np. postanowienie o stwierdzeniu nabycia spadku lub akt poświadczenia dziedziczenia. Jeśli są inni spadkobiercy, wpis dotyczy przysługujących im udziałów.',
  source: { institution: 'Sąd Rejonowy dla Krakowa-Podgórza', url: 'https://krakow-podgorze.sr.gov.pl/wnioski-o-wpiszalozenie-ksiegi-wieczystej,m,m2,440,270,353', checkedAt: '2026-10-30' },
}

export const inheritance: Scenario = {
  id: 'inheritance', title: 'Dziedziczenie mieszkania',
  profile: { name: 'Marta Nowak', business: 'Spadek po ojcu' },
  assumptions: ['Marta jest powołana do spadku po ojcu, do którego należy mieszkanie z księgą wieczystą.'],
  question: 'Czy masz już potwierdzenie nabycia spadku?',
  answers: [
    { id: 'inheritance-unconfirmed', label: 'Potrzebuję potwierdzenia dziedziczenia' },
    { id: 'inheritance-confirmed', label: 'Mam już potwierdzenie dziedziczenia' },
  ],
  events: [
    { id: 'inheritance-unconfirmed', type: 'answer-selected', answerId: 'inheritance-unconfirmed', planItemIds: ['inheritance-statement-plan', 'inheritance-confirmation-plan', 'inheritance-tax-plan', 'land-register-plan'] },
    { id: 'inheritance-confirmed', type: 'answer-selected', answerId: 'inheritance-confirmed', planItemIds: ['inheritance-tax-plan', 'land-register-plan'] },
  ],
  tasks: [
    informationTask('inheritance-decision', 'Sąd rejonowy — sprawy spadkowe', 'Informacja o przyjęciu lub odrzuceniu spadku', inheritanceStatement),
    informationTask('probate-court', 'Sąd rejonowy — sprawy spadkowe', 'Informacja o potwierdzeniu dziedziczenia', inheritanceConfirmation),
    informationTask('inheritance-tax-office', 'Urząd skarbowy', 'Informacja o zgłoszeniu spadku', inheritanceTax),
    informationTask('land-register-court', 'Sąd rejonowy — księgi wieczyste', 'Informacja o wpisie do księgi wieczystej', landRegister),
  ],
  results: [inheritanceStatement, inheritanceConfirmation, inheritanceTax, landRegister],
  plan: [
    { id: 'inheritance-statement-plan', title: 'Decyzja o spadku', taskId: 'inheritance-decision', resultId: inheritanceStatement.id },
    { id: 'inheritance-confirmation-plan', title: 'Potwierdzenie dziedziczenia', taskId: 'probate-court', resultId: inheritanceConfirmation.id },
    { id: 'inheritance-tax-plan', title: 'Zgłoszenie SD-Z2', taskId: 'inheritance-tax-office', resultId: inheritanceTax.id },
    { id: 'land-register-plan', title: 'Księga wieczysta', taskId: 'land-register-court', resultId: landRegister.id },
  ],
}

const identityGuide: Source = {
  institution: 'Gov.pl — dowód osobisty',
  url: 'https://www.gov.pl/web/gov/uzyskaj-dowod-osobisty',
  checkedAt: '2026-11-02',
}
const passportGuide: Source = {
  institution: 'Gov.pl — paszport',
  url: 'https://www.gov.pl/web/gov/paszport-informacje-o-dokumencie',
  checkedAt: '2026-11-02',
}

export const nameChange: Scenario = {
  id: 'name-change',
  title: 'Zmiana nazwiska po ślubie',
  summary: 'Sprawdź, które dokumenty wymagają aktualizacji po zmianie nazwiska.',
  profile: { name: 'Anna Kowalska', business: 'Zmiana nazwiska po ślubie' },
  assumptions: ['Akt małżeństwa sporządzono, nazwisko jest już zaktualizowane w rejestrze PESEL. Anna ma ważny dowód osobisty i paszport.'],
  scopeNote: 'Nie zmieniamy nazwiska w USC — porządkujemy dokumenty po zarejestrowanej zmianie.',
  question: 'Czy masz ważny paszport?',
  answers: [
    { id: 'passport-active', label: 'Tak, mam ważny paszport' },
    { id: 'passport-none', label: 'Nie mam ważnego paszportu' },
  ],
  events: [
    { id: 'name-with-passport', type: 'answer-selected', answerId: 'passport-active', planItemIds: ['identity-plan', 'passport-plan'] },
    { id: 'name-without-passport', type: 'answer-selected', answerId: 'passport-none', planItemIds: ['identity-plan'] },
  ],
  tasks: [
    informationTask('identity-office', 'Urząd gminy', 'Informacja o wymianie dowodu po zmianie nazwiska', {
      id: 'identity-after-name',
      text: 'Złóż wniosek o nowy dowód osobisty jak najszybciej. Dowód z nieaktualnym nazwiskiem zostanie unieważniony po 120 dniach od zarejestrowania zmiany w PESEL. Wniosek możesz złożyć w dowolnym urzędzie gminy; usługa jest bezpłatna.',
      source: identityGuide,
    }),
    informationTask('passport-office', 'Urząd wojewódzki', 'Informacja o ważności paszportu po zmianie nazwiska', {
      id: 'passport-after-name',
      text: 'Jeśli masz paszport z poprzednim nazwiskiem, przestanie być ważny po 120 dniach od zmiany danych. Wystąp o nowy paszport, jeśli chcesz z niego korzystać po tym terminie.',
      source: passportGuide,
    }),
  ],
  results: [
    { id: 'identity-after-name', text: 'Złóż wniosek o nowy dowód osobisty jak najszybciej. Dowód z nieaktualnym nazwiskiem zostanie unieważniony po 120 dniach od zarejestrowania zmiany w PESEL. Wniosek możesz złożyć w dowolnym urzędzie gminy; usługa jest bezpłatna.', source: identityGuide },
    { id: 'passport-after-name', text: 'Jeśli masz paszport z poprzednim nazwiskiem, przestanie być ważny po 120 dniach od zmiany danych. Wystąp o nowy paszport, jeśli chcesz z niego korzystać po tym terminie.', source: passportGuide },
  ],
  plan: [
    { id: 'identity-plan', title: 'Nowy dowód osobisty', taskId: 'identity-office', resultId: 'identity-after-name', note: 'Wniosek złóż jak najszybciej; usługa jest bezpłatna.' },
    { id: 'passport-plan', title: 'Paszport', taskId: 'passport-office', resultId: 'passport-after-name', note: 'Ten krok dotyczy wyłącznie osoby, która ma paszport.' },
  ],
}

const residenceGuide: Source = {
  institution: 'Gov.pl — zameldowanie',
  url: 'https://www.gov.pl/web/gov/zamelduj-sie-na-pobyt-staly-lub-czasowy-dluzszy-niz-3-miesiace',
  checkedAt: '2026-11-02',
}
const idAddressGuide: Source = {
  institution: 'Gov.pl — dowód osobisty',
  url: 'https://www.gov.pl/web/gov/dowod-osobisty-informacje',
  checkedAt: '2026-11-02',
}

export const movingHome: Scenario = {
  id: 'moving-home',
  title: 'Przeprowadzka',
  summary: 'Ustal, czy potrzebujesz meldunku i jakie dane rzeczywiście się zmieniają.',
  profile: { name: 'Jan Wiśniewski', business: 'Przeprowadzka w Polsce' },
  assumptions: ['Jan przeprowadził się w Polsce do wynajętego mieszkania. Ma umowę najmu, a właściciel potwierdza jego pobyt.'],
  scopeNote: 'Zakres dotyczy wyłącznie meldunku i dokumentu tożsamości; nie zakładamy, że trzeba zgłaszać adres każdej instytucji.',
  question: 'Czy przeprowadzka jest na stałe?',
  answers: [
    { id: 'permanent-move', label: 'Tak, zamieszkuję tu na stałe' },
    { id: 'temporary-move', label: 'Nie, pobyt potrwa ponad 3 miesiące' },
  ],
  events: [
    { id: 'permanent-move-answer', type: 'answer-selected', answerId: 'permanent-move', planItemIds: ['permanent-residence-plan', 'id-address-plan'] },
    { id: 'temporary-move-answer', type: 'answer-selected', answerId: 'temporary-move', planItemIds: ['temporary-residence-plan', 'id-address-plan'] },
  ],
  tasks: [
    informationTask('residence-office', 'Urząd gminy', 'Informacja o obowiązku meldunkowym', {
      id: 'residence-registration',
      text: 'Zamelduj się najpóźniej 30. dnia od zamieszkania. Przy meldunku na pobyt stały możesz jednocześnie wymeldować się z poprzedniego miejsca pobytu stałego. Przy meldunku czasowym ponad 3 miesiące możesz pozostawić dotychczasowy meldunek stały.',
      source: residenceGuide,
    }),
    informationTask('identity-data', 'Ministerstwo Cyfryzacji', 'Informacja o adresie w dowodzie osobistym', {
      id: 'address-in-id',
      text: 'Nie wymieniasz dowodu osobistego tylko dlatego, że się przeprowadzasz. Adres zameldowania nie jest już umieszczany na nowych dowodach; starszy dokument z adresem również nie wymaga wymiany z tego powodu.',
      source: idAddressGuide,
    }),
  ],
  results: [
    { id: 'residence-registration', text: 'Zamelduj się najpóźniej 30. dnia od zamieszkania. Przy meldunku na pobyt stały możesz jednocześnie wymeldować się z poprzedniego miejsca pobytu stałego. Przy meldunku czasowym ponad 3 miesiące możesz pozostawić dotychczasowy meldunek stały.', source: residenceGuide },
    { id: 'address-in-id', text: 'Nie wymieniasz dowodu osobistego tylko dlatego, że się przeprowadzasz. Adres zameldowania nie jest już umieszczany na nowych dowodach; starszy dokument z adresem również nie wymaga wymiany z tego powodu.', source: idAddressGuide },
  ],
  plan: [
    { id: 'permanent-residence-plan', title: 'Meldunek na pobyt stały', taskId: 'residence-office', resultId: 'residence-registration', note: 'Możesz połączyć meldunek z wymeldowaniem poprzedniego adresu.' },
    { id: 'temporary-residence-plan', title: 'Meldunek na pobyt czasowy', taskId: 'residence-office', resultId: 'residence-registration', note: 'Dotychczasowy meldunek stały może pozostać.' },
    { id: 'id-address-plan', title: 'Dowód osobisty', taskId: 'identity-data', resultId: 'address-in-id', note: 'Sama zmiana adresu nie wymaga wymiany dowodu.' },
  ],
}

const vehicleGuide: Source = {
  institution: 'Gov.pl — rejestracja pojazdu',
  url: 'https://www.gov.pl/web/gov/zarejestruj-pojazd',
  checkedAt: '2026-11-02',
}
const vehicleNoticeGuide: Source = {
  institution: 'Gov.pl — nabycie lub zbycie pojazdu',
  url: 'https://www.gov.pl/web/gov/zglos-zbycie-lub-nabycie-pojazdu-na-przyklad-sprzedaz-kupno-darowizne',
  checkedAt: '2026-11-02',
}
const pccCarGuide: Source = {
  institution: 'Ministerstwo Finansów — PCC',
  url: 'https://www.gov.pl/web/gov/zaplac-podatek-od-czynnosci-cywilnoprawnych',
  checkedAt: '2026-11-02',
}

export const buyingCar: Scenario = {
  id: 'buying-car',
  title: 'Kupno używanego samochodu',
  summary: 'Sprawdź PCC i rejestrację auta kupionego od osoby prywatnej.',
  profile: { name: 'Jan Wiśniewski', business: 'Kupno używanego samochodu' },
  assumptions: ['Jan kupił w Polsce w 2026 r. używany samochód od osoby prywatnej za 30 000 zł. Umowa nie podlega VAT, a wartość auta przekracza 1 000 zł.'],
  scopeNote: 'Zakres obejmuje wyłącznie zakup auta od osoby prywatnej. Import, zakup na fakturę VAT i zwolnienia indywidualne wymagają osobnej oceny.',
  question: 'Jakie formalności mam wykonać po zakupie?',
  answers: [{ id: 'car-purchase', label: 'Pokaż przygotowany plan po zakupie' }],
  events: [{ id: 'car-purchase-answer', type: 'answer-selected', answerId: 'car-purchase', planItemIds: ['car-pcc-plan', 'vehicle-registration-plan'] }],
  tasks: [
    informationTask('car-tax-office', 'Urząd skarbowy', 'Informacja o PCC od zakupu samochodu', {
      id: 'car-pcc',
      text: 'Przy zakupie rzeczy ruchomej od osoby prywatnej, gdy umowa nie podlega VAT, kupujący płaci PCC. Stawka wynosi 2% wartości rynkowej; przy wartości podstawy do 1 000 zł obowiązuje zwolnienie. Deklarację PCC-3 i podatek złóż w ciągu 14 dni od zawarcia umowy.',
      source: pccCarGuide,
    }),
    informationTask('vehicle-registration', 'Starostwo powiatowe', 'Informacja o rejestracji kupionego pojazdu', {
      id: 'vehicle-registration-result',
      text: 'Złóż wniosek o rejestrację pojazdu w wydziale komunikacji właściwym dla miejsca zamieszkania w ciągu 30 dni od nabycia. Przygotuj w szczególności dokument własności, dowód rejestracyjny, kartę pojazdu, jeśli została wydana, i tablice rejestracyjne. Przy nabyciu w 2026 r. nie zgłaszasz osobno samego nabycia pojazdu; obowiązek rejestracji pozostaje.',
      source: vehicleGuide,
    }),
  ],
  results: [
    { id: 'car-pcc', text: 'Przy zakupie rzeczy ruchomej od osoby prywatnej, gdy umowa nie podlega VAT, kupujący płaci PCC. Stawka wynosi 2% wartości rynkowej; przy wartości podstawy do 1 000 zł obowiązuje zwolnienie. Deklarację PCC-3 i podatek złóż w ciągu 14 dni od zawarcia umowy.', source: pccCarGuide, caseText: 'W opisanej sytuacji wartość przekracza próg 1 000 zł; kupujący uwzględnia PCC-3 i płatność w swoim planie.' },
    { id: 'vehicle-registration-result', text: 'Złóż wniosek o rejestrację pojazdu w wydziale komunikacji właściwym dla miejsca zamieszkania w ciągu 30 dni od nabycia. Przygotuj w szczególności dokument własności, dowód rejestracyjny, kartę pojazdu, jeśli została wydana, i tablice rejestracyjne. Przy nabyciu w 2026 r. nie zgłaszasz osobno samego nabycia pojazdu; obowiązek rejestracji pozostaje.', source: vehicleGuide, additionalSources: [vehicleNoticeGuide] },
  ],
  plan: [
    { id: 'car-pcc-plan', title: 'PCC-3 i podatek', taskId: 'car-tax-office', resultId: 'car-pcc', note: 'Podatek oblicza się od wartości rynkowej, nie zawsze od ceny z umowy.' },
    { id: 'vehicle-registration-plan', title: 'Rejestracja samochodu', taskId: 'vehicle-registration', resultId: 'vehicle-registration-result', note: 'Termin: 30 dni od nabycia.' },
  ],
}

const supportDecisionGuide: Source = {
  institution: 'Gov.pl — świadczenie wspierające',
  url: 'https://www.gov.pl/web/gov/uzyskaj-swiadczenie-wspierajace',
  checkedAt: '2026-11-02',
}

export const supportBenefit: Scenario = {
  id: 'support-benefit',
  title: 'Orzeczenie i świadczenie wspierające',
  summary: 'Sprawdź kolejność decyzji WZON i wniosku do ZUS.',
  profile: { name: 'Ewa Kamińska', business: 'Świadczenie wspierające' },
  assumptions: ['Ewa jest osobą pełnoletnią. Sprawa dotyczy świadczenia wspierającego, a nie świadczenia pielęgnacyjnego ani dodatku pielęgnacyjnego.'],
  scopeNote: 'Sama diagnoza lub orzeczenie o niepełnosprawności nie przesądza o prawie do świadczenia wspierającego.',
  question: 'Jaki jest stan decyzji ustalającej poziom potrzeby wsparcia?',
  answers: [
    { id: 'support-decision-pending', label: 'Czekam na decyzję WZON' },
    { id: 'support-decision-final', label: 'Mam ostateczną decyzję WZON: 76 punktów' },
  ],
  events: [
    { id: 'support-pending-answer', type: 'answer-selected', answerId: 'support-decision-pending', planItemIds: ['wzon-decision-plan'] },
    { id: 'support-final-answer', type: 'answer-selected', answerId: 'support-decision-final', planItemIds: ['wzon-decision-plan', 'support-application-plan'] },
  ],
  tasks: [
    informationTask('wzon', 'Wojewódzki zespół do spraw orzekania o niepełnosprawności', 'Informacja o decyzji ustalającej poziom potrzeby wsparcia', {
      id: 'wzon-decision',
      text: 'Decyzję o poziomie potrzeby wsparcia wydaje WZON. Wniosek może być papierowy albo elektroniczny przez Emp@tię. Prawo do świadczenia wspierającego wymaga ostatecznej decyzji z wynikiem od 70 do 100 punktów.',
      source: supportDecisionGuide,
    }),
    informationTask('support-zus', 'ZUS', 'Informacja o wniosku o świadczenie wspierające', {
      id: 'support-application',
      text: 'Po uzyskaniu ostatecznej decyzji WZON złóż osobny elektroniczny wniosek do ZUS. W 2026 r. osoby z wynikiem 70–77 punktów mogą już składać wniosek. Złożenie wniosku nie gwarantuje przyznania świadczenia; ZUS rozstrzyga sprawę po weryfikacji warunków.',
      source: supportDecisionGuide,
    }),
  ],
  results: [
    { id: 'wzon-decision', text: 'Decyzję o poziomie potrzeby wsparcia wydaje WZON. Wniosek może być papierowy albo elektroniczny przez Emp@tię. Prawo do świadczenia wspierającego wymaga ostatecznej decyzji z wynikiem od 70 do 100 punktów.', source: supportDecisionGuide },
    { id: 'support-application', text: 'Po uzyskaniu ostatecznej decyzji WZON złóż osobny elektroniczny wniosek do ZUS. W 2026 r. osoby z wynikiem 70–77 punktów mogą już składać wniosek. Złożenie wniosku nie gwarantuje przyznania świadczenia; ZUS rozstrzyga sprawę po weryfikacji warunków.', source: supportDecisionGuide, caseText: 'Przy przyjętych 76 punktach Ewa może złożyć wniosek od 2026 r., gdy decyzja jest ostateczna.' },
  ],
  plan: [
    { id: 'wzon-decision-plan', title: 'Decyzja WZON', taskId: 'wzon', resultId: 'wzon-decision', note: 'Jeśli decyzja nie jest jeszcze ostateczna, poczekaj z wnioskiem do ZUS.' },
    { id: 'support-application-plan', title: 'Wniosek do ZUS', taskId: 'support-zus', resultId: 'support-application', note: 'Osobny wniosek elektroniczny; ZUS wydaje własne rozstrzygnięcie.' },
  ],
}

const taxSummonsGuide: Source = {
  institution: 'Ministerstwo Finansów — prawa i obowiązki podatnika',
  url: 'https://www.podatki.gov.pl/abc-podatkow/uprawnienia-i-obowiazki-podatnika/',
  checkedAt: '2026-11-02',
}
const taxCorrespondenceGuide: Source = {
  institution: 'Krajowa Administracja Skarbowa — e-Korespondencja',
  url: 'https://www.gov.pl/web/kas/e-korespondencja--szybka-bezpieczna-i-wygodna-komunikacja-z-administracja-skarbowa',
  checkedAt: '2026-11-02',
}

export const taxSummons: Scenario = {
  id: 'tax-summons',
  title: 'Wezwanie z urzędu skarbowego',
  summary: 'Przeczytaj wezwanie i przygotuj odpowiedź do sprawdzenia.',
  profile: { name: 'Ewa Kamińska', business: 'Wyjaśnienie kosztów w zeznaniu PIT' },
  assumptions: ['To fikcyjne pismo doręczone 29.10.2026. Urząd prosi w nim o kopie trzech wskazanych dokumentów dotyczących kosztów w PIT za 2025 r.; pismo podaje termin odpowiedzi do 10.11.2026.'],
  scopeNote: 'Termin z przykładu pochodzi z fikcyjnego pisma. W rzeczywistej sprawie sprawdź datę i sposób odpowiedzi wskazane w swoim wezwaniu.',
  question: 'Czy masz przygotowane dokumenty wymienione w wezwaniu?',
  answers: [{ id: 'tax-documents-ready', label: 'Tak, przygotuj odpowiedź do przejrzenia' }],
  events: [{ id: 'tax-summons-answer', type: 'answer-selected', answerId: 'tax-documents-ready', planItemIds: ['tax-summons-plan'] }],
  tasks: [informationTask('tax-summons-agent', 'Urząd skarbowy', 'Wyjaśnienie zakresu wezwania i sposobu odpowiedzi', {
    id: 'tax-summons-guidance',
    text: 'Odpowiedz na wezwanie w terminie podanym w piśmie i dołącz wyłącznie wskazane w nim dokumenty. Wezwanie może wymagać wyjaśnień lub przedłożenia dokumentów. Pismo ogólne jest dostępne w e-Korespondencji KAS, ale korzystaj z formularza wskazanego w wezwaniu, jeśli urząd podał szczególny kanał lub formularz.',
    source: taxSummonsGuide,
    additionalSources: [taxCorrespondenceGuide],
  })],
  results: [{
    id: 'tax-summons-guidance',
    text: 'Odpowiedz na wezwanie w terminie podanym w piśmie i dołącz wyłącznie wskazane w nim dokumenty. Wezwanie może wymagać wyjaśnień lub przedłożenia dokumentów. Pismo ogólne jest dostępne w e-Korespondencji KAS, ale korzystaj z formularza wskazanego w wezwaniu, jeśli urząd podał szczególny kanał lub formularz.',
    caseText: 'Przygotowany szkic odpowiada tylko na opisane w fikcyjnym wezwaniu pytanie. Nie ujawnia ani nie sprawdza wewnętrznego statusu postępowania.',
    source: taxSummonsGuide,
    additionalSources: [taxCorrespondenceGuide],
  }],
  plan: [{ id: 'tax-summons-plan', title: 'Przygotowanie odpowiedzi', taskId: 'tax-summons-agent', resultId: 'tax-summons-guidance', documents: ['Kopie trzech dokumentów wymienionych w fikcyjnym wezwaniu.'], note: 'Termin w przykładzie: 10.11.2026. Potwierdzenie w aplikacji nie wyśle pisma.' }],
}

export const unavailableAgent: Scenario = {
  id: 'unavailable-agent',
  title: 'Agent chwilowo niedostępny',
  summary: 'Zobacz, jak aplikacja pokazuje brak odpowiedzi bez wymyślania wyniku.',
  profile: { name: 'Jan Wiśniewski', business: 'Próba niedostępności agenta' },
  assumptions: ['To osobny scenariusz demonstracyjny. Jedna informacja pozostaje niedostępna, a niezależne zadanie może zakończyć się normalnie.'],
  scopeNote: 'Niedostępność jest wybrana ręcznie i nie zmienia pozostałych spraw.',
  question: 'Czy uruchomić próbę z niedostępnym agentem?',
  answers: [{ id: 'run-unavailable-agent', label: 'Tak, pokaż tę próbę' }],
  events: [{ id: 'unavailable-agent-answer', type: 'answer-selected', answerId: 'run-unavailable-agent', planItemIds: ['available-tax-plan', 'unavailable-social-plan'] }],
  tasks: [
    informationTask('available-tax-task', 'Urząd skarbowy', 'Niezależna informacja o terminie zgłoszenia', {
      id: 'available-tax-result',
      text: 'Niezależne zadanie zakończyło się i zwróciło tę przygotowaną informację.',
      source: taxGuide,
    }),
    {
      id: 'unavailable-social-task',
      institution: 'ZUS',
      capabilities: ['Sprawdzenie przygotowanej informacji'],
      description: 'Sprawdzenie informacji w ZUS',
      unavailable: true,
      playback: [],
    },
  ],
  results: [
    { id: 'available-tax-result', text: 'Niezależne zadanie zakończyło się i zwróciło tę przygotowaną informację.', source: taxGuide },
    { id: 'unavailable-social-result', text: 'Brak wyniku. Agent jest niedostępny; informacja pozostaje nieznana.', source: zusGuide },
  ],
  plan: [
    { id: 'available-tax-plan', title: 'Niezależna informacja', taskId: 'available-tax-task', resultId: 'available-tax-result' },
    { id: 'unavailable-social-plan', title: 'Oczekiwanie na ZUS', taskId: 'unavailable-social-task', resultId: 'unavailable-social-result', note: 'Wynik nieznany; aplikacja nie podstawia odpowiedzi.' },
  ],
}

export const scenarios: Scenario[] = [closingBusiness, childbirth, buyingFlat, buildingHouse, bereavement, inheritance, nameChange, movingHome, buyingCar, supportBenefit, taxSummons, unavailableAgent]

export type Case = {
  fullRoute?: boolean
  demo?: import('./showcase').SpecialDemo
  flow?: FlowEvent[]
  id: number
  scenarioId: string
  events: ScenarioEvent[]
  history?: HistoryEntry[]
  playbacks?: { taskId: TaskId; revealedSteps: number }[]
  birthAction?: 'review' | 'sent'
  consentGranted?: boolean
  transfer?: { fromTaskId: TaskId; toTaskId: TaskId; resultId: ResultId; closingDate: string }
  actionEvents?: { type: 'ceidg-application-sent' }[]
  taxReplyAction?: 'review' | 'sent'
  employeeStatus?: EmployeeStatus
}

export function answerEmployment(current: Case, employeeStatus: EmployeeStatus): Case {
  if (current.scenarioId !== closingBusiness.id || current.employeeStatus === employeeStatus) return current
  return { ...current, employeeStatus }
}

export function transferIfReady(current: Case): Case {
  if (!current.consentGranted || current.transfer) return current
  const scenario = scenarios.find((item) => item.id === current.scenarioId)
  if (!scenario) return current
  const destination = scenario.tasks.find((task) => task.dependency)
  const dependency = destination?.dependency
  const source = scenario.tasks.find((task) => task.id === dependency?.taskId)
  const playback = current.playbacks?.find((item) => item.taskId === source?.id)
  const result = scenario.results.find((item) => item.id === dependency?.resultId)
  if (!destination || !dependency || !source || !playback || playback.revealedSteps < source.playback.length || !result?.closingDate) return current
  return { ...current, transfer: { fromTaskId: source.id, toTaskId: destination.id, resultId: result.id, closingDate: result.closingDate } }
}

export function answerCase(current: Case, answerId: AnswerId): Case {
  const scenario = scenarios.find((item) => item.id === current.scenarioId)
  const event = scenario?.events.find((item) => item.answerId === answerId)
  if (!scenario || current.events.length > 0 || !event) return current
  const playbacks = event.planItemIds.flatMap((id) => {
    const item = scenario.plan.find((entry) => entry.id === id)
    const task = scenario.tasks.find((entry) => entry.id === item?.taskId)
    return item && task ? [{ taskId: item.taskId, revealedSteps: task.unavailable ? 0 : 1 }] : []
  })
  if (playbacks.length === 0) return current
  return { ...current, events: [...current.events, event], playbacks }
}

export type HistoryEntry =
  | { kind: 'started' }
  | { kind: 'answer'; answerId: AnswerId }
  | { kind: 'employment-answer'; status: EmployeeStatus }
  | { kind: 'task'; taskId: TaskId }
  | { kind: 'action'; label: string }
  | { kind: 'consent' }
  | { kind: 'transfer' }
  | { kind: 'result'; taskId: TaskId }

export function recordChanges(before: Case, after: Case): Case {
  if (before === after) return before
  const history = [...(before.history ?? [{ kind: 'started' } as const])]
  const scenario = scenarios.find((item) => item.id === after.scenarioId)
  const answer = after.events[0]
  if (!before.events.length && answer) {
    history.push({ kind: 'answer', answerId: answer.answerId })
    for (const playback of after.playbacks ?? []) history.push({ kind: 'task', taskId: playback.taskId })
  }
  if (before.employeeStatus !== after.employeeStatus && after.employeeStatus) history.push({ kind: 'employment-answer', status: after.employeeStatus })
  if (before.birthAction !== 'sent' && after.birthAction === 'sent') history.push({ kind: 'action', label: birthSentStatus })
  if (before.taxReplyAction !== 'sent' && after.taxReplyAction === 'sent') history.push({ kind: 'action', label: 'Odpowiedź do urzędu skarbowego oznaczono jako wysłaną w symulacji; niczego nie wysłano.' })
  if (!(before.actionEvents ?? []).some((entry) => entry.type === 'ceidg-application-sent') && (after.actionEvents ?? []).some((entry) => entry.type === 'ceidg-application-sent')) {
    history.push({ kind: 'action', label: ceidgSentStatus })
  }
  if (!before.consentGranted && after.consentGranted) history.push({ kind: 'consent' })
  for (const playback of after.playbacks ?? []) {
    const task = scenario?.tasks.find((item) => item.id === playback.taskId)
    const previous = before.playbacks?.find((item) => item.taskId === playback.taskId)?.revealedSteps ?? 0
    if (task && task.playback.some((step) => step.kind === 'complete') && previous < task.playback.length && playback.revealedSteps >= task.playback.length) history.push({ kind: 'result', taskId: task.id })
  }
  if (!before.transfer && after.transfer) history.push({ kind: 'transfer' })
  return { ...after, history }
}

export function historyText(entry: HistoryEntry, current: Case): string {
  const scenario = scenarios.find((item) => item.id === current.scenarioId) ?? closingBusiness
  switch (entry.kind) {
    case 'started': return `Rozpoczęto sprawę: ${scenario.title}`
    case 'answer': return scenario.answers.find((answer) => answer.id === entry.answerId)?.label ?? ''
    case 'employment-answer': return scenario.employmentAnswers?.find((answer) => answer.status === entry.status)?.label ?? ''
    case 'task': return `Zadanie: ${scenario.tasks.find((task) => task.id === entry.taskId)?.description ?? ''}`
    case 'action': return entry.label
    case 'consent': return 'Zgoda na udostępnienie daty agentowi ZUS w tej sprawie została udzielona.'
    case 'transfer': return `Udostępniono agentowi ZUS datę zakończenia działalności: ${current.transfer?.closingDate ?? ''}.`
    case 'result': {
      const task = scenario.tasks.find((item) => item.id === entry.taskId)
      const item = scenario.plan.find((plan) => plan.taskId === task?.id)
      const result = scenario.results.find((value) => value.id === item?.resultId)
      return [result?.caseText?.replaceAll('{closingDate}', current.transfer?.closingDate ?? ''), result?.text].filter(Boolean).join(' ')
    }
  }
}
