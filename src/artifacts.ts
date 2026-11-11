import { fieldLabel } from './input-contracts'
import type { FlowMessage, FlowStep } from './flow'

export type Artifact = { id: string; title: string; step: FlowStep; resultText: string; resultFields: Record<string, string>; kind: 'formularz' | 'potwierdzenie' | 'decyzja' }

type Recipe = [string, Artifact['kind']][]
const recipes: Record<string, Recipe> = {
  'ceidg-plan': [['Wniosek CEIDG-1', 'formularz'], ['Wyrejestrowanie ZUS ZWPA i ZWUA', 'formularz'], ['Potwierdzenie wykreślenia z CEIDG', 'potwierdzenie']],
  'employees-zus': [['Wyrejestrowanie pracowników ZUS', 'formularz'], ['Potwierdzenie przekazania do ZUS', 'potwierdzenie']],
  'cash-register-close': [['Protokół zamknięcia kasy', 'formularz'], ['Potwierdzenie wyrejestrowania kasy', 'potwierdzenie']],
  'vat-plan': [['Zgłoszenie VAT-Z', 'formularz'], ['UPO zgłoszenia VAT-Z', 'potwierdzenie']],
  'birth-plan': [['Zgłoszenie urodzenia', 'formularz'], ['Akt urodzenia', 'decyzja']],
  'benefit-plan': [['Wniosek o 800+', 'formularz'], ['Potwierdzenie świadczenia 800+', 'potwierdzenie']],
  'pcc-plan': [['Potwierdzenie rozliczenia PCC', 'potwierdzenie']],
  'kw-plan': [['Potwierdzenie wpisu własności', 'potwierdzenie']],
  'in1-plan': [['Informacja IN-1', 'formularz'], ['Potwierdzenie przyjęcia IN-1', 'potwierdzenie']],
  'mpzp-plan': [['Informacja o planie dla działki', 'potwierdzenie']],
  'wz-plan': [['Wniosek o warunki zabudowy', 'formularz'], ['Decyzja o warunkach zabudowy', 'decyzja']],
  'permit-plan': [['Wniosek o pozwolenie na budowę', 'formularz'], ['Pozwolenie na budowę', 'decyzja']],
  'notice-plan': [['Zawiadomienie o rozpoczęciu robót', 'formularz'], ['Potwierdzenie zawiadomienia', 'potwierdzenie']],
  'death-registration-plan': [['Zgłoszenie zgonu', 'formularz'], ['Akt zgonu', 'decyzja']],
  'funeral-benefit-plan': [['Wniosek o zasiłek pogrzebowy', 'formularz'], ['Potwierdzenie zasiłku pogrzebowego', 'potwierdzenie']],
  'inheritance-statement-plan': [['Oświadczenie spadkowe', 'formularz'], ['Potwierdzenie oświadczenia', 'potwierdzenie']],
  'inheritance-confirmation-plan': [['Wniosek o stwierdzenie nabycia spadku', 'formularz'], ['Potwierdzenie dziedziczenia', 'decyzja']],
  'inheritance-tax-plan': [['Zgłoszenie SD-Z2', 'formularz'], ['UPO zgłoszenia SD-Z2', 'potwierdzenie']],
  'land-register-plan': [['Wniosek o wpis prawa własności', 'formularz'], ['Potwierdzenie wpisu w księdze', 'potwierdzenie']],
  'identity-plan': [['Wniosek o dowód osobisty', 'formularz'], ['Potwierdzenie wydania dowodu', 'potwierdzenie']],
  'passport-plan': [['Wniosek o paszport', 'formularz'], ['Potwierdzenie wydania paszportu', 'potwierdzenie']],
  'permanent-residence-plan': [['Zgłoszenie pobytu stałego', 'formularz'], ['Potwierdzenie zameldowania', 'potwierdzenie']],
  'temporary-residence-plan': [['Zgłoszenie pobytu czasowego', 'formularz'], ['Potwierdzenie pobytu czasowego', 'potwierdzenie']],
  'id-address-plan': [['Potwierdzenie aktualizacji rejestrów', 'potwierdzenie']],
  'car-pcc-plan': [['Deklaracja PCC-3', 'formularz'], ['UPO deklaracji PCC-3', 'potwierdzenie'], ['Potwierdzenie płatności PCC', 'potwierdzenie']],
  'vehicle-registration-plan': [['Wniosek o rejestrację pojazdu', 'formularz'], ['Potwierdzenie rejestracji pojazdu', 'potwierdzenie']],
  'wzon-decision-plan': [['Decyzja o poziomie potrzeby wsparcia', 'decyzja']],
  'support-application-plan': [['Wniosek o świadczenie wspierające', 'formularz'], ['Potwierdzenie przyznania świadczenia', 'potwierdzenie']],
  'tax-summons-plan': [['Odpowiedź na wezwanie', 'formularz'], ['Potwierdzenie przyjęcia odpowiedzi', 'potwierdzenie']],
  'available-tax-plan': [['Potwierdzenie rozliczenia podatku', 'potwierdzenie']],
  'unavailable-social-plan': [['Potwierdzenie rozliczenia składek', 'potwierdzenie']],
}

export function artifactsForReceipt(message: FlowMessage, step: FlowStep | undefined): Artifact[] {
  if (!step || message.kind !== 'receipt' || (step.unavailable && message.attempt === 1)) return []
  const recipe = recipes[step.id]
  if (!recipe) return []
  const completedTools = step.tools.slice(0, message.toolCount ?? 0)
  const outputs = Object.fromEntries(Object.entries(completedTools.at(-1)?.output ?? {}).filter(([key]) => !['status', 'source', 'outcome', 'receipt'].includes(key)))
  const payment = completedTools.find(tool => tool.name === 'payments.execute_mock_transfer')
  const resultFields = { ...outputs, ...(payment ? { 'Kwota płatności (PLN)': payment.input.amount_pln, 'Rachunek płatności': payment.input.from_account } : {}) }
  return recipe.map(([title, kind], index) => ({ id: `${step.id}-${index}`, title, kind, step, resultText: message.text, resultFields }))
}

export async function downloadArtifact(artifact: Artifact, caseId: number) {
  const [{ jsPDF }, response] = await Promise.all([import('jspdf'), fetch('/fonts/NotoSans-Regular.ttf')])
  if (!response.ok) throw new Error('Nie udało się wczytać czcionki dokumentu')
  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  const pdf = new jsPDF()
  pdf.addFileToVFS('NotoSans-Regular.ttf', btoa(binary))
  pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  pdf.setFont('NotoSans')
  pdf.setFontSize(18)
  const titleLines = pdf.splitTextToSize(artifact.title, 175) as string[]
  pdf.text(titleLines, 18, 25)
  pdf.setFontSize(10)
  let y = 25 + titleLines.length * 8 + 10
  const lines = [
    'DOKUMENT PRZYKŁADOWY — SYMULACJA',
    'Ten plik został wygenerowany lokalnie w demonstracji. Nie jest dokumentem urzędowym.',
    `Sprawa: DEMO-${caseId} · Krok: ${artifact.step.title}`,
    `Instytucja: ${artifact.step.institution}`,
    `Rodzaj: ${artifact.kind}`,
    ...(artifact.kind === 'formularz' ? ['Przykładowa treść i dane formularza:', ...artifact.step.documents] : ['Przykładowy wynik działania:', artifact.resultText, ...Object.entries(artifact.resultFields).map(([key, value]) => `${fieldLabel(key)}: ${value}`), `Numer referencyjny: DEMO-${caseId}-${artifact.step.id}`, ...artifact.step.dataSources.map(source => `${source.label}: ${source.value}`)]),
  ]
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 175) as string[]
    for (const part of wrapped) { if (y > 278) { pdf.addPage(); y = 20 } pdf.text(part, 18, y); y += 6 }
    y += 3
  }
  const filename = artifact.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[łŁ]/g, 'l').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  pdf.save(`${filename}-demo-${caseId}.pdf`)
}
