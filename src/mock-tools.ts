import { generatedByStep } from './input-contracts'
export type MockTool = { name: string; label: string; input: Record<string, string>; output: Record<string, string> }

const actions: Record<string, [string, string, string, string]> = {
  'cash-register-close': ['tax', 'close_cash_register', 'Zamykam kasę i składam dokumenty wyrejestrowania', 'Kasa zamknięta i wyrejestrowana'],
  'ceidg-plan': ['ceidg', 'submit_termination', 'Składam CEIDG-1 i ZUS ZWUA', 'Działalność wykreślona, ubezpieczenia zamknięte'],
  'employees-zus': ['zus', 'deregister_employees', 'Wyrejestrowuję pracowników i członków rodzin', 'Wyrejestrowania zapisane'],
  'vat-plan': ['tax', 'submit_vat_z', 'Składam VAT-Z', 'Rejestr VAT zaktualizowany'],
  'birth-plan': ['usc', 'register_birth', 'Rejestruję urodzenie i nadaję PESEL', 'Akt urodzenia, PESEL i meldunek gotowe'],
  'benefit-plan': ['zus', 'grant_800_plus', 'Składam i rozliczam wniosek o 800+', 'Świadczenie przyznane, wypłata uruchomiona'],
  'pcc-plan': ['notary', 'settle_property_tax', 'Rozliczam PCC z aktu notarialnego', 'Podatek rozliczony przez notariusza'],
  'kw-plan': ['land_registry', 'register_ownership', 'Wykonuję wpis własności', 'Wpis własności dokonany'],
  'in1-plan': ['municipality', 'submit_in1', 'Składam IN-1 i aktualizuję rejestr nieruchomości', 'Nieruchomość zgłoszona'],
  'mpzp-plan': ['municipality', 'resolve_parcel_plan', 'Pobieram plan i ustalam warunki dla działki', 'Warunki planistyczne ustalone'],
  'wz-plan': ['municipality', 'issue_zoning_decision', 'Składam wniosek i uzyskuję decyzję WZ', 'Ostateczna decyzja WZ wydana'],
  'permit-plan': ['construction', 'issue_building_permit', 'Składam dokumentację i uzyskuję pozwolenie', 'Pozwolenie na budowę wydane'],
  'notice-plan': ['construction', 'register_start_notice', 'Zgłaszam rozpoczęcie robót', 'Zawiadomienie zapisane, formalności zamknięte'],
  'death-registration-plan': ['usc', 'register_death', 'Rejestruję zgon i wystawiam akt', 'Zgon zarejestrowany, akt wydany'],
  'funeral-benefit-plan': ['zus', 'pay_funeral_benefit', 'Składam wniosek i rozliczam zasiłek', 'Zasiłek przyznany i wypłacony'],
  'inheritance-statement-plan': ['notary', 'record_inheritance_statement', 'Zapisuję Twoje oświadczenie spadkowe', 'Oświadczenie zapisane'],
  'inheritance-confirmation-plan': ['probate', 'confirm_inheritance', 'Składam wniosek i uzyskuję potwierdzenie dziedziczenia', 'Potwierdzenie dziedziczenia wydane'],
  'inheritance-tax-plan': ['tax', 'settle_inheritance_tax', 'Składam SD-Z2 i zapisuję zwolnienie', 'Sprawa podatku spadkowego zamknięta'],
  'land-register-plan': ['land_registry', 'register_inherited_ownership', 'Wpisuję odziedziczoną własność', 'Wpis własności dokonany'],
  'identity-plan': ['identity', 'issue_identity_document', 'Składam wniosek i wydaję nowy dowód', 'Nowy dokument wydany i dostarczony'],
  'passport-plan': ['passport', 'issue_passport', 'Składam wniosek i wydaję nowy paszport', 'Nowy paszport wydany i dostarczony'],
  'permanent-residence-plan': ['residence', 'register_permanent_address', 'Melduję pod nowym adresem', 'Meldunek stały zapisany'],
  'temporary-residence-plan': ['residence', 'register_temporary_address', 'Zapisuję meldunek czasowy', 'Meldunek czasowy zapisany'],
  'id-address-plan': ['identity', 'sync_address_records', 'Synchronizuję dane po zmianie adresu', 'Rejestry zgodne, dokument zachowuje ważność'],
  'car-pcc-plan': ['tax', 'submit_pcc3', 'Składam deklarację PCC-3', 'Deklaracja przyjęta, podatek opłacony'],
  'vehicle-registration-plan': ['vehicles', 'register_vehicle', 'Rejestruję samochód i wydaję dokumenty', 'Samochód zarejestrowany, dokumenty dostarczone'],
  'wzon-decision-plan': ['wzon', 'resolve_support_decision', 'Uzyskuję ostateczną decyzję o poziomie wsparcia', 'Ostateczna decyzja: 76 punktów'],
  'support-application-plan': ['zus', 'grant_support_benefit', 'Składam wniosek i uruchamiam świadczenie', 'Świadczenie przyznane, wypłata uruchomiona'],
  'tax-summons-plan': ['tax', 'resolve_summons', 'Przekazuję odpowiedź i zamykam wezwanie', 'Dokumenty zweryfikowane, wezwanie zamknięte'],
  'available-tax-plan': ['tax', 'settle_business_record', 'Rozliczam sprawę podatkową', 'Sprawa podatkowa zamknięta'],
  'unavailable-social-plan': ['zus', 'complete_insurance_record', 'Zamykam sprawę składek', 'Sprawa składek zamknięta'],
}

// Local deterministic fixtures. No network request or real MCP client is created.
export function mockToolsForStep(stepId: string, person: string, data: Record<string, string>): MockTool[] {
  if (stepId === 'zus-consent') return []
  const recipe = actions[stepId]
  if (!recipe) throw new Error(`Missing action tools: ${stepId}`)
  const [service, action, label, outcome] = recipe
  const input = { person, ...data }
  const calls: MockTool[] = [
    { name: `${service}.read_case_data`, label: 'Pobieram dane sprawy i rejestru', input, output: { status: 'verified', data_source: 'user_messages_and_authorized_register' } },
    { name: `${service}.${action}`, label, input: { ...input, authorization: 'user_confirmed' }, output: { status: 'executed', document: stepId, source: 'mock_mcp' } },
    { name: `${service}.get_final_confirmation`, label: 'Odbieram końcowe potwierdzenie', input: { operation: stepId }, output: { status: 'completed', outcome, receipt: `DEMO-${stepId}`, ...generatedByStep(stepId, data) } },
  ]
  if (stepId === 'death-registration-plan') calls[0] = { name: 'documents.read_death_certificate', label: 'Odczytuję przesłany PDF i sprawdzam dane osoby', input, output: { status: 'verified', deceased_name: data.deceased_name ?? '', deceased_pesel: data.deceased_pesel ?? '', source: 'user_supplied_pdf' } }
  if (stepId === 'funeral-benefit-plan') calls[0] = { name: 'documents.read_funeral_invoices', label: 'Odczytuję dokumenty zgonu i przesłane koszty pogrzebu', input, output: { status: 'verified', source: 'user_supplied_pdfs', recipient: person } }
  if (stepId === 'ceidg-plan') calls.splice(2, 0,
    { name: 'zus.receive_ceidg_date', label: 'Przekazuję datę do agenta ZUS', input: { closing_date: data['closing-date'] ?? '', authorization: 'zus-consent' }, output: { status: 'received' } },
    { name: 'zus.deregister_payer_and_owner', label: 'Zamykam zgłoszenia płatnika i właściciela w ZUS', input, output: { status: 'completed', forms: 'ZWPA, ZWUA' } })
  if (stepId === 'car-pcc-plan') calls.splice(2, 0,
    { name: 'payments.execute_mock_transfer', label: 'Opłacam podatek z potwierdzonego rachunku', input: { amount_pln: String(Number(data.vehicle_value) * .02), from_account: data.payment_account ?? '', authorization: 'user_confirmed_declaration_and_payment' }, output: { status: 'settled', receipt: 'DEMO-PCC-PAYMENT' } })
  if (stepId === 'identity-plan' || stepId === 'passport-plan') calls.splice(1, 0,
    { name: `${service}.verify_mock_identity`, label: 'Potwierdzam tożsamość i dane dokumentu', input: { person, document_number: data.identity_number ?? data.passport_number ?? '', photo: data.identity_photo ?? '', photo_attachment: data['file:zdjecie-do-dokumentu.jpg'] ?? '', registry_access: data.registry_access ?? '', verification_mode: 'mock_remote_identity' }, output: { status: 'verified' } })
  return calls
}
