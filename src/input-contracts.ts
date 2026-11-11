import type { FlowAttachment, FlowQuestion } from './flow'

export type InputOrigin = { kind: 'message' | 'attachment' | 'agent'; reference: string }
export type InputContext = { scenarioId: string; answerId?: string; employment?: string; data?: Record<string, string> }
type Bundle = { id: string; prompt: string; label: string; values: Record<string, string> }
const bundle = ({ id, prompt, label, values }: Bundle): FlowQuestion => ({ id, text: prompt, options: [{ value: id, label, message: Object.entries(values).map(([key, value]) => `${fieldLabel(key)}: ${value}`).join('\n'), data: values }] })

const labels: Record<string, string> = {
  'closing-date': 'Data zakończenia działalności', cash_register_id: 'Numer kasy fiskalnej', employees_end_date: 'Data końca ubezpieczeń', employees_family: 'Zgłoszeni członkowie rodzin', birth_card_date: 'Data karty urodzenia', child_sex: 'Płeć wskazana na karcie urodzenia', notarial_reference: 'Numer aktu notarialnego', notary: 'Notariusz z aktu', pcc_settlement: 'Rozliczenie PCC z aktu', property_price: 'Wartość nieruchomości', seller_pesel: 'PESEL sprzedającego', seller_address: 'Adres sprzedającego', contract_reference: 'Numer umowy kupna', registration_document: 'Dowód rejestracyjny', oc_document: 'Potwierdzenie OC', support_pesel: 'PESEL osoby objętej wsparciem', medical_documentation: 'Przesłana dokumentacja medyczna', settlement_tax_basis: 'Podstawa rozliczenia podatku', settlement_zus_basis: 'Podstawa rozliczenia składek', funeral_total: 'Suma kosztów z rachunków', applicant_paid: 'Koszty pokryte przez wnioskodawcę',
  child_pesel: 'PESEL nadany dziecku przez USC', birth_record: 'Akt urodzenia z USC', death_record: 'Akt zgonu', termination_confirmation: 'Potwierdzenie wykreślenia z CEIDG', registered_closing_date: 'Data potwierdzona przez CEIDG', zoning_decision: 'Decyzja WZ z poprzedniego kroku', building_permit: 'Uzyskane pozwolenie na budowę', inheritance_confirmation: 'Potwierdzenie dziedziczenia', final_support_decision: 'Ostateczna decyzja WZON', final_support_points: 'Potwierdzony poziom wsparcia', identity_photo: 'Przesłane zdjęcie',
  applicant_name: 'Imię i nazwisko', applicant_pesel: 'PESEL', applicant_address: 'Adres', applicant_email: 'Kontakt', applicant_nationality: 'Obywatelstwo',
  company_name: 'Firma', company_nip: 'NIP', company_regon: 'REGON', company_address: 'Adres firmy', employees: 'Lista pracowników', cash_register: 'Kasa fiskalna',
  payout_account: 'Rachunek do wypłaty', payment_account: 'Rachunek do płatności', account_owner: 'Właściciel rachunku', payment_authorization: 'Zakres płatności',
  child_name: 'Imię i nazwisko dziecka', child_birth_date: 'Data urodzenia', birth_city: 'Miejsce urodzenia', second_parent_name: 'Drugi rodzic', second_parent_pesel: 'PESEL drugiego rodzica', parent_status: 'Sytuacja rodzinna',
  property_address: 'Adres nieruchomości', land_register: 'Numer księgi wieczystej', property_area: 'Powierzchnia', property_share: 'Udział', transaction_date: 'Data zakupu', seller: 'Sprzedający',
  parcel_id: 'Identyfikator działki', investor_right: 'Prawo do działki', project_id: 'Projekt', construction_start: 'Planowany start robót', site_manager: 'Kierownik budowy',
  deceased_name: 'Osoba zmarła', deceased_pesel: 'PESEL osoby zmarłej', death_date: 'Data zgonu', death_place: 'Miejsce zgonu', applicant_relation: 'Relacja do osoby zmarłej', funeral_cost: 'Koszty pogrzebu',
  inheritance_share: 'Udział spadkowy', inheritance_basis: 'Podstawa dziedziczenia', heirs: 'Spadkobiercy', knowledge_date: 'Data uzyskania informacji',
  old_surname: 'Poprzednie nazwisko', surname: 'Nowe nazwisko', identity_number: 'Dotychczasowy dowód', passport_number: 'Dotychczasowy paszport', delivery_address: 'Adres doręczenia',
  old_address: 'Poprzedni adres', new_address: 'Nowy adres', move_date: 'Data zamieszkania', stay_until: 'Pobyt do', occupancy_basis: 'Prawo do lokalu',
  vehicle_vin: 'VIN', vehicle_registration: 'Dotychczasowa rejestracja', vehicle_value: 'Wartość rynkowa', purchase_date: 'Data zakupu auta', seller_type: 'Sprzedający', vehicle_origin: 'Pochodzenie auta', insurance: 'OC',
  support_applicant: 'Osoba, której dotyczy wsparcie', representation: 'Sposób działania', support_points: 'Poziom wsparcia', decision_number: 'Numer decyzji',
  summons_reference: 'Numer wezwania', summons_date: 'Data wezwania', summons_deadline: 'Termin odpowiedzi', tax_year: 'Rok podatkowy', office: 'Urząd prowadzący sprawę',
  settlement_period: 'Okres rozliczenia', settlement_subject: 'Zakres sprawy', registry_access: 'Dostęp do rejestrów',
}
export function fieldLabel(key: string) { return labels[key] ?? key }

const registers: Record<string, string[]> = {
  'closing-business': ['ceidg', 'zus', 'tax'], childbirth: ['pesel', 'usc', 'zus'], 'buying-flat': ['land_registry', 'tax', 'municipality'],
  'building-house': ['cadastre', 'municipality', 'construction'], bereavement: ['usc', 'zus'], inheritance: ['usc', 'probate', 'land_registry', 'tax'],
  'name-change': ['pesel', 'usc', 'identity', 'passport'], 'moving-home': ['pesel', 'residence', 'identity'], 'buying-car': ['vehicles', 'tax', 'payments'],
  'support-benefit': ['wzon', 'zus'], 'tax-summons': ['tax'], 'unavailable-agent': ['ceidg', 'tax', 'zus'],
}
const registerNames: Record<string, string> = { ceidg: 'CEIDG', zus: 'ZUS', tax: 'urząd skarbowy', pesel: 'rejestr PESEL', usc: 'USC', land_registry: 'księgi wieczyste', municipality: 'urząd gminy', cadastre: 'ewidencja działek', construction: 'rejestry budowlane', probate: 'sąd spadkowy', identity: 'rejestr dowodów', passport: 'rejestr paszportów', residence: 'rejestr meldunków', vehicles: 'rejestr pojazdów', payments: 'potwierdzenia płatności', wzon: 'WZON' }
export function registryQuestion(scenarioId: string): FlowQuestion {
  const scopes = registers[scenarioId]
  return { id: 'registry-access', presentation: 'action', text: `Czy mogę pobrać dane potrzebne do tej sprawy z: ${scopes.map(scope => registerNames[scope] ?? scope).join(', ')} i porównać je z tym, co wysyłasz?`, options: [{ value: 'authorized', label: 'Tak, udostępniam dane potrzebne do tej sprawy', message: `Zgadzam się na pobranie danych z rejestrów ${scopes.map(scope => registerNames[scope] ?? scope).join(', ')} wyłącznie do tej sprawy.`, data: { registry_access: scopes.join(',') } }] }
}

function accountQuestion(kind: 'payout' | 'payment'): FlowQuestion {
  return { id: `${kind}-account`, text: kind === 'payout' ? 'W profilu masz zapisany rachunek •4321. Użyć go do wypłaty, czy podasz inny?' : 'W profilu masz zapisany rachunek •4321. Użyć go do opłat w tej sprawie, czy podasz inny? Każdą płatność jeszcze potwierdzisz.', options: ['4321', '8765'].map(end => ({ value: end, label: end === '4321' ? 'Użyj zapisanego rachunku •4321' : 'Podaję inny rachunek •8765', message: `${end === '4321' ? 'Użyj mojego zapisanego rachunku:' : 'Podaję inny rachunek:'} PL00 0000 0000 0000 0000 0000 ${end}.\nWłaściciel: dane, które podałem w tej sprawie.`, data: { [`${kind}_account`]: `PL00 0000 0000 0000 0000 0000 ${end}`, account_owner: '{applicant_name}', ...(kind === 'payment' ? { payment_authorization: 'Opłaty tej sprawy, po odrębnym potwierdzeniu operacji' } : {}) } })) }
}

export function supplementQuestions(context: InputContext): FlowQuestion[] {
  const { scenarioId: id, answerId, employment } = context
  const questions: FlowQuestion[] = []
  if (id === 'closing-business') {
    questions.push(bundle({ id: 'company', prompt: 'Podaj nazwę, NIP, REGON i adres firmy, którą zamykasz.', label: 'Przekaż dane firmy', values: { company_name: 'Firma demonstracyjna {applicant_name}', company_nip: '0000000000', company_regon: '000000000', company_address: 'Lipowa 12, 00-000 Warszawa' } }))
    questions.push({ id: 'cash-register', text: 'Czy firma używa kasy fiskalnej?', options: [{ value: 'none', label: 'Nie mam kasy fiskalnej', data: { cash_register: 'none' } }, { value: 'online', label: 'Mam kasę online — też ją zamknij', message: 'Mam kasę online.\nNumer kasy: DEMO-KASA-001.\nZamknij ją razem z firmą.', data: { cash_register: 'online', cash_register_id: 'DEMO-KASA-001' } }] })
    if (employment === 'employs') questions.push(bundle({ id: 'employee-list', prompt: 'Podeślij listę osób do wyrejestrowania, ich identyfikatory i datę końca ubezpieczenia.', label: 'Przekaż dane pracowników', values: { employees: 'Jan Przykładowy, PESEL 11111111111; Ewa Przykładowa, PESEL 22222222222', employees_end_date: '{closing-date}', employees_family: 'Brak zgłoszonych członków rodzin w tym przykładzie' } }))
  }
  if (id === 'childbirth') questions.push(bundle({ id: 'parents', prompt: 'Podaj dane drugiego rodzica i sytuację rodzinną. To trafi do zgłoszenia urodzenia.', label: 'Przekaż dane rodziców', values: { second_parent_name: 'Piotr Nowak', second_parent_pesel: '11111111111', parent_status: 'Rodzice w małżeństwie, dane zgodne z aktem' } }))
  if (id === 'buying-flat') questions.push(bundle({ id: 'property-details', prompt: 'Podeślij szczegóły kupionego mieszkania. Pozostałe dane odczytam z aktu, który dołączysz.', label: 'Przekaż dane mieszkania', values: { property_address: '{property}', land_register: 'DEMO-KW-001', property_area: '54 m²', property_share: '1/1', transaction_date: '26.10.2026', seller: answerId === 'developer-market' ? 'Deweloper demonstracyjny' : 'Sprzedający z aktu notarialnego' } }))
  if (id === 'building-house') questions.push(bundle({ id: 'construction-details', prompt: 'Potrzebuję jeszcze danych inwestycji: prawa do działki, projektu, kierownika i planowanego terminu robót.', label: 'Przekaż dane inwestycji', values: { parcel_id: '{parcel}', investor_right: 'Własność inwestora, dokument w załączniku', project_id: 'DEMO-PROJEKT-001', site_manager: 'Anna Projektowa, uprawnienia DEMO-UPR-001', construction_start: '01.12.2026' } }))
  if (id === 'bereavement') questions.push(bundle({ id: 'death-details', prompt: 'Kim jesteś dla osoby zmarłej? Datę i miejsce zgonu odczytam z przesłanego dokumentu.', label: 'Przekaż szczegóły zgłoszenia', values: { applicant_relation: 'Dziecko osoby zmarłej', funeral_cost: 'Koszty i rachunki opisane w załączniku' } }))
  if (id === 'inheritance') questions.push(bundle({ id: 'inheritance-details', prompt: 'Czyjego spadku dotyczy sprawa i co dziedziczysz? Podaj też udział i innych spadkobierców.', label: 'Przekaż dane spadku', values: { deceased_name: 'Jan Nowak', deceased_pesel: '11111111111', death_date: '20.09.2026', applicant_relation: 'Dziecko spadkodawcy', inheritance_basis: 'Dziedziczenie ustawowe', inheritance_share: '1/1', heirs: 'Jedyny spadkobierca: {applicant_name}', property_address: 'Lipowa 12/8, Warszawa', land_register: 'DEMO-KW-002', property_value: '500000 PLN — wartość z przykładowego wykazu majątku', knowledge_date: '27.10.2026' } }))
  if (id === 'name-change') {
    questions.push(bundle({ id: 'identity-details', prompt: 'Podeślij dane dokumentu, który mam wymienić, i adres, pod który dostarczyć nowy.', label: 'Przekaż dane dokumentów', values: { old_surname: 'Nowak', identity_number: 'DEMO-DOWOD-001', delivery_address: 'Zielona 5/3, 00-000 Warszawa', ...(answerId === 'passport-active' ? { passport_number: 'DEMO-PASZPORT-001' } : {}) } }))
  }
  if (id === 'moving-home') questions.push(bundle({ id: 'residence-details', prompt: 'Od kiedy mieszkasz pod nowym adresem? Podeślij też poprzedni adres i podstawę korzystania z lokalu.', label: 'Przekaż dane przeprowadzki', values: { old_address: 'Stara 3/2, Warszawa', new_address: '{address}', move_date: '27.10.2026', occupancy_basis: 'Umowa najmu i zgoda właściciela w załączniku', ...(answerId === 'temporary-move' ? { stay_until: '31.12.2027' } : {}) } }))
  if (id === 'buying-car') questions.push(bundle({ id: 'vehicle-details', prompt: 'Podeślij VIN, rejestrację, datę zakupu i dane pochodzenia auta. Cenę i sprzedającego porównam z umową.', label: 'Przekaż dane auta', values: { vehicle_vin: 'DEMO-VIN-000000001', vehicle_registration: 'DEMO-001', purchase_date: '26.10.2026', seller_type: 'Osoba prywatna, transakcja poza VAT', vehicle_origin: 'Pojazd zarejestrowany w Polsce', insurance: 'Polisa OC z potwierdzeniem w załączniku' } }))
  if (id === 'support-benefit') questions.push(bundle({ id: 'support-person', prompt: 'Świadczenie dotyczy Ciebie czy działasz za kogoś? Potrzebuję danych osoby i podstawy działania.', label: 'Działam we własnym imieniu', values: { support_applicant: '{applicant_name}', support_pesel: '{applicant_pesel}', representation: 'We własnym imieniu', ...(answerId === 'support-decision-final' ? { decision_number: 'DEMO-WZON-76', support_points: '76', decision_final: 'yes' } : {}) } }))
  if (id === 'tax-summons') questions.push(bundle({ id: 'summons-details', prompt: 'Podeślij numer wezwania, urząd, termin odpowiedzi i rok, którego dotyczy sprawa.', label: 'Przekaż dane wezwania', values: { summons_reference: 'DEMO-US-2026-001', summons_date: '29.10.2026', summons_deadline: '10.11.2026', tax_year: '2025', office: 'Urząd skarbowy wskazany w wezwaniu' } }))
  if (id === 'unavailable-agent') questions.push(bundle({ id: 'settlement-details', prompt: 'Której firmy i okresu dotyczy rozliczenie? Potrzebuję tego przed kontaktem z urzędami.', label: 'Przekaż zakres rozliczenia', values: { company_nip: '0000000000', company_name: 'Firma demonstracyjna {applicant_name}', settlement_period: 'wrzesień 2026', settlement_subject: 'Rozliczenie podatku i składek wskazanego okresu' } }))
  if (['bereavement'].includes(id)) questions.push(accountQuestion('payout'))
  if (['buying-car', 'inheritance', 'name-change'].includes(id)) questions.push(accountQuestion('payment'))
  questions.push(registryQuestion(id))
  return questions
}

// Normalize the explicit mock reply into named fields, never silently into an unknown profile.
export function answerFields(questionId: string, value: string): Record<string, string> {
  if (questionId === 'child') { const [name, date, city] = value.split(',').map(value => value.trim()); return { child_name: name, child_birth_date: date, birth_city: city, child_sex: value === 'Zofia Nowak, 25.10.2026, Warszawa' ? 'K' : 'M' } }
  if (questionId === 'account') return { payout_account: value.includes('8765') ? 'PL00 0000 0000 0000 0000 0000 8765' : 'PL00 0000 0000 0000 0000 0000 4321', account_owner: '{applicant_name}' }
  if (questionId === 'vehicle') return { vehicle_value: value.includes('40000') ? '40000' : '25000' }
  return {}
}

export function contractAttachment(file: string, title: string, values: Record<string, string>, fields: Record<string, string> = {}): FlowAttachment {
  return { name: file, mime: file.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf', size: file.endsWith('.jpg') ? '94 KB' : '216 KB', title, fields: Object.keys(fields).length ? fields : Object.fromEntries(Object.entries(values).map(([key, value]) => [fieldLabel(key), value])), data: values }
}

export const documentQuestionIds = new Set(['company', 'employee-list', 'property-details', 'vehicle-details', 'summons-details', 'settlement-details'])

const documentFieldGroups: Record<string, string[]> = {
  'construction-details': ['parcel_id', 'investor_right', 'project_id', 'site_manager'],
  'inheritance-details': ['deceased_name', 'deceased_pesel', 'death_date', 'inheritance_basis', 'inheritance_share', 'heirs', 'property_address', 'land_register', 'property_value'],
  'residence-details': ['new_address', 'occupancy_basis'],
  'identity-details': ['old_surname'],
  'support-person': ['decision_number', 'support_points', 'decision_final'],
}
export function remainingQuestions(context: InputContext): FlowQuestion[] {
  const prompts: Record<string, string> = { 'construction-details': 'Dane projektu mam z dokumentacji. Kiedy planujesz rozpocząć roboty?', 'inheritance-details': 'Dane spadku mam z dokumentów. Kim jesteś dla spadkodawcy i kiedy dowiedziałeś się o nabyciu spadku?', 'residence-details': 'Nowy adres i podstawę zameldowania mam z dokumentu. Podaj poprzedni adres, datę przeprowadzki i okres pobytu.', 'identity-details': 'Podaj numer dokumentu do wymiany i adres doręczenia. Poprzednie nazwisko mam z aktu.' }
  return supplementQuestions(context).filter(question => !documentQuestionIds.has(question.id)).map(question => {
    const excluded = documentFieldGroups[question.id]
    if (!excluded) return question
    return { ...question, text: prompts[question.id] ?? question.text, options: question.options.map(option => {
      const data = Object.fromEntries(Object.entries(option.data ?? {}).filter(([key]) => !excluded.includes(key)))
      return { ...option, data, message: Object.entries(data).map(([key, value]) => `${fieldLabel(key)}: ${value}`).join('\n') }
    }) }
  })
}

export function sourceAttachments(context: InputContext, file: string, title: string): FlowAttachment[] {
  const id = context.scenarioId
  let data: Record<string, string> = {}
  if (id === 'closing-business') data = { company_nip: '{company_nip}', company_regon: '{company_regon}', company_address: '{company_address}', company_name: '{company_name}' }
  if (id === 'childbirth') data = { child_name: '{child_name}', child_birth_date: '{child_birth_date}', birth_city: '{birth_city}', child_sex: '{child_sex}', birth_card_date: '25.10.2026', mother_name: '{applicant_name}' }
  if (id === 'buying-flat') data = { property_address: '{property_address}', land_register: '{land_register}', property_area: '{property_area}', property_share: '{property_share}', transaction_date: '{transaction_date}', property_price: '500000 PLN', pcc_settlement: 'Potwierdzenie rozliczenia notarialnego w akcie', notarial_reference: 'DEMO-AKT-001', notary: 'Notariusz z przesłanego aktu' }
  if (id === 'building-house') data = { parcel_id: '{parcel_id}', project_id: '{project_id}', investor_right: '{investor_right}', site_manager: '{site_manager}', project_author: 'Projektant DEMO-UPR-002' }
  if (id === 'inheritance') data = { deceased_name: '{deceased_name}', deceased_pesel: '{deceased_pesel}', property_address: '{property_address}', land_register: '{land_register}', inheritance_share: '{inheritance_share}', ...(context.answerId === 'inheritance-confirmed' ? { inheritance_confirmation: 'DEMO-SPADEK-PRZEKAZANY', inheritance_confirmation_date: '27.10.2026' } : { relationship_document: 'DEMO-AKT-URODZENIA-SPADKOBIERCY' }) }
  if (id === 'name-change') data = { marriage_reference: 'DEMO-MALZENSTWO-001', marriage_date: '24.10.2026', old_surname: '{old_surname}', surname: '{surname}' }
  if (id === 'moving-home') data = { new_address: '{new_address}', occupancy_basis: '{occupancy_basis}', owner_consent: 'Zgoda właściciela zawarta w przekazanym dokumencie' }
  if (id === 'buying-car') data = { vehicle_vin: '{vehicle_vin}', vehicle_registration: '{vehicle_registration}', vehicle_value: '{vehicle_value}', purchase_date: '{purchase_date}', buyer: '{applicant_name}', seller: 'Jan Sprzedający', seller_pesel: '11111111111', seller_address: 'Zielona 1, 00-000 Warszawa', contract_reference: 'DEMO-UMOWA-AUTO-001' }
  if (id === 'support-benefit') data = context.answerId === 'support-decision-final' ? { decision_number: '{decision_number}', support_points: '{support_points}', decision_final: 'yes', support_pesel: '{applicant_pesel}' } : { medical_documentation: 'DEMO-DOKUMENTACJA-MEDYCZNA', support_pesel: '{applicant_pesel}', assessment_request: 'Wniosek o ustalenie poziomu potrzeby wsparcia' }
  if (id === 'tax-summons') data = { attachments: '{attachments}', tax_year: '{tax_year}', expense_documents: 'Trzy dokumenty odpowiadające pozycji wybranej w sprawie' }
  if (id === 'bereavement') data = { funeral_cost: 'Koszty i rachunki opisane w załączniku', funeral_total: '9000 PLN', applicant_paid: context.data?.['funeral-costs']?.includes('i rodzina') ? '4500 PLN' : '9000 PLN', cost_bearer: '{applicant_name}', deceased_name: '{deceased_name}', expense_documents: 'Rachunki i podział kosztów w przekazanym PDF' }
  if (id === 'unavailable-agent') data = { company_nip: '{company_nip}', settlement_period: '{settlement_period}', settlement_tax_basis: 'Przesłane rozliczenie podatku: brak dopłaty w przykładzie', settlement_zus_basis: 'Przesłane deklaracje składkowe: komplet za podany okres' }
  const documentData = Object.assign({}, ...supplementQuestions(context).map(question => Object.fromEntries(Object.entries(question.options[0].data ?? {}).filter(([key]) => documentQuestionIds.has(question.id) || documentFieldGroups[question.id]?.includes(key))))) as Record<string, string>
  const documentValues = { ...data, ...documentData }
  const attachments = [contractAttachment(file, title, documentValues)]
  if (id === 'closing-business' && context.employment === 'employs') attachments.push(contractAttachment('lista-pracownikow.pdf', 'Lista pracowników do wyrejestrowania', { employees: documentData.employees, employees_end_date: documentData.employees_end_date, employees_family: documentData.employees_family }))
  if (id === 'buying-car') attachments.push(contractAttachment('dowod-rejestracyjny.pdf', 'Dotychczasowy dowód rejestracyjny', { vehicle_vin: '{vehicle_vin}', vehicle_registration: '{vehicle_registration}', registration_document: 'DEMO-DOWOD-REJ-001' }), contractAttachment('potwierdzenie-oc.pdf', 'Potwierdzenie OC', { vehicle_vin: '{vehicle_vin}', oc_document: 'DEMO-OC-001' }))
  if (id === 'name-change') attachments.push(contractAttachment('zdjecie-do-dokumentu.jpg', 'Zdjęcie do nowych dokumentów', { identity_photo: 'mock-user-provided-photo', photo_subject: '{applicant_name}' }))
  if (id === 'tax-summons') attachments.push(contractAttachment('wezwanie.pdf', 'Wezwanie z urzędu skarbowego', { summons_reference: '{summons_reference}', summons_date: '{summons_date}', summons_deadline: '{summons_deadline}', tax_year: '{tax_year}', office: '{office}' }))
  if (id === 'inheritance' && context.answerId === 'inheritance-unconfirmed') attachments.push(contractAttachment('akt-zgonu-spadkodawcy.pdf', 'Akt zgonu spadkodawcy', { deceased_name: documentValues.deceased_name, deceased_pesel: documentValues.deceased_pesel, death_record: 'DEMO-AKT-ZGONU-SPADKODAWCY' }))
  return attachments
}

export function generatedByStep(step: string, data: Record<string, string>): Record<string, string> {
  const outputs: Record<string, Record<string, string>> = {
    'ceidg-plan': { termination_confirmation: 'DEMO-CEIDG-ZAMKNIETE', registered_closing_date: data['closing-date'] },
    'birth-plan': { child_pesel: 'DEMO-PESEL-DZIECKA', birth_record: 'DEMO-AKT-URODZENIA', child_registered: 'yes' },
    'death-registration-plan': { death_record: 'DEMO-AKT-ZGONU' }, 'wz-plan': { zoning_decision: 'DEMO-DECYZJA-WZ' }, 'permit-plan': { building_permit: 'DEMO-POZWOLENIE' },
    'inheritance-confirmation-plan': { inheritance_confirmation: 'DEMO-POSTANOWIENIE-SPADKOWE' }, 'wzon-decision-plan': { final_support_decision: data.decision_number ?? 'DEMO-WZON-UZYSKANA-76', final_support_points: '76' },
  }
  return outputs[step] ?? {}
}

const common = ['applicant_name', 'applicant_pesel', 'applicant_address', 'applicant_email', 'registry_access']
const fieldsByStep: Record<string, string[]> = {
  'zus-consent': ['company_nip', 'closing-date'], 'ceidg-plan': ['company_name', 'company_nip', 'company_regon', 'company_address', 'closing-date'],
  'employees-zus': ['employees', 'employees_end_date', 'employees_family', 'registered_closing_date'], 'vat-plan': ['company_nip', 'registered_closing_date', 'termination_confirmation'], 'cash-register-close': ['cash_register_id', 'company_nip', 'registered_closing_date'],
  'birth-plan': ['child_name', 'child_birth_date', 'birth_city', 'second_parent_name', 'second_parent_pesel', 'parent_status', 'child_sex', 'birth_card_date'], 'benefit-plan': ['child_name', 'child_pesel', 'birth_record', 'payout_account', 'account_owner'],
  'pcc-plan': ['property_address', 'transaction_date', 'property_price', 'pcc_settlement', 'notarial_reference', 'notary'], 'kw-plan': ['land_register', 'property_share', 'notarial_reference'], 'in1-plan': ['property_address', 'property_area', 'property_share', 'transaction_date'],
  'mpzp-plan': ['parcel_id', 'investor_right'], 'wz-plan': ['parcel_id', 'project_id', 'investor_right'], 'permit-plan': ['parcel_id', 'project_id', 'investor_right', 'site_manager'], 'notice-plan': ['building_permit', 'construction_start', 'site_manager'],
  'death-registration-plan': ['deceased_name', 'deceased_pesel', 'death_date', 'death_place', 'applicant_relation'], 'funeral-benefit-plan': ['deceased_name', 'deceased_pesel', 'death_record', 'funeral_cost', 'funeral_total', 'applicant_paid', 'applicant_relation', 'payout_account', 'account_owner'],
  'inheritance-statement-plan': ['deceased_name', 'deceased_pesel', 'inheritance-choice', 'inheritance_basis', 'heirs'], 'inheritance-confirmation-plan': ['death_record', 'heirs', 'inheritance_share', 'relationship_document'], 'inheritance-tax-plan': ['inheritance_confirmation', 'knowledge_date', 'inheritance_share', 'applicant_relation', 'property_value'], 'land-register-plan': ['inheritance_confirmation', 'land_register', 'property_address', 'inheritance_share', 'payment_account'],
  'identity-plan': ['old_surname', 'surname', 'identity_number', 'marriage_reference', 'identity_photo', 'delivery_address', 'payment_account'], 'passport-plan': ['surname', 'passport_number', 'marriage_reference', 'identity_photo', 'delivery_address', 'payment_account'],
  'permanent-residence-plan': ['new_address', 'old_address', 'move_date', 'occupancy_basis', 'owner_consent'], 'temporary-residence-plan': ['new_address', 'old_address', 'move_date', 'stay_until', 'occupancy_basis', 'owner_consent'], 'id-address-plan': ['new_address', 'move_date'],
  'car-pcc-plan': ['vehicle_vin', 'vehicle_value', 'purchase_date', 'seller_type', 'seller', 'seller_pesel', 'seller_address', 'contract_reference', 'payment_account', 'payment_authorization'], 'vehicle-registration-plan': ['vehicle_vin', 'vehicle_registration', 'purchase_date', 'vehicle_origin', 'contract_reference', 'registration_document', 'oc_document'],
  'wzon-decision-plan': ['support_applicant', 'support_pesel', 'representation'], 'support-application-plan': ['final_support_decision', 'final_support_points', 'support_pesel', 'payout_account', 'account_owner'],
  'tax-summons-plan': ['summons_reference', 'summons_date', 'summons_deadline', 'office', 'tax_year', 'expense_documents'],
  'available-tax-plan': ['company_nip', 'settlement_period', 'settlement_subject', 'settlement_tax_basis'], 'unavailable-social-plan': ['company_nip', 'settlement_period', 'settlement_subject', 'settlement_zus_basis'],
}
export function requiredStepFields(stepId: string, context: InputContext): string[] {
  if (!fieldsByStep[stepId]) throw new Error(`Missing input contract: ${stepId}`)
  const fields = [...common, ...fieldsByStep[stepId]]
  if (stepId === 'permit-plan' && context.answerId === 'without-plan') fields.push('zoning_decision')
  if (stepId === 'wzon-decision-plan') fields.push(context.answerId === 'support-decision-final' ? 'decision_number' : 'medical_documentation')
  return [...new Set(fields)]
}

const attachmentOnly = new Set(['birth_card_date', 'notarial_reference', 'notary', 'pcc_settlement', 'property_price', 'marriage_reference', 'identity_photo', 'owner_consent', 'seller_pesel', 'seller_address', 'contract_reference', 'registration_document', 'oc_document', 'medical_documentation', 'decision_number', 'relationship_document', 'expense_documents', 'funeral_total', 'applicant_paid', 'settlement_tax_basis', 'settlement_zus_basis'])
const agentOnly = new Set(['child_pesel', 'birth_record', 'registered_closing_date', 'termination_confirmation', 'zoning_decision', 'building_permit', 'final_support_decision', 'final_support_points'])
const documentOrAgent = new Set(['death_record', 'inheritance_confirmation'])
const userOnly = new Set(['registry_access', 'payment_account', 'payout_account', 'payment_authorization'])
export function sourceAllowed(field: string, origin: InputOrigin): boolean {
  if (agentOnly.has(field)) return origin.kind === 'agent'
  if (attachmentOnly.has(field)) return origin.kind === 'attachment'
  if (documentOrAgent.has(field)) return origin.kind === 'attachment' || origin.kind === 'agent'
  if (userOnly.has(field)) return origin.kind === 'message'
  return origin.kind === 'message' || origin.kind === 'attachment'
}
