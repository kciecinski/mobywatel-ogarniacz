import { scenarios } from './scenario'

export type InstitutionAgent = {
  id: string
  institution: string
  portrait: string
  capabilities: string[]
  taskIds: string[]
}

function canonicalInstitution(institution: string) {
  if (institution === 'Starosta' || institution === 'Starostwo powiatowe') return 'Starosta (starostwo powiatowe)'
  if (institution.startsWith('Sąd rejonowy')) return 'Sąd rejonowy'
  return institution
}

function portraitFor(institution: string) {
  const name = institution.toLocaleLowerCase('pl-PL')
  if (name === 'zus') return 'zus'
  if (name.includes('urząd skarbowy')) return 'tax'
  if (name.includes('urząd stanu cywilnego')) return 'civil'
  if (name.includes('urząd gminy')) return 'municipality'
  if (name.includes('starost')) return 'county'
  if (name.includes('sąd')) return 'court'
  if (name.includes('notari')) return 'notary'
  if (name.includes('inspektorat') || name.includes('nadzoru budowlanego')) return 'inspector'
  if (name.includes('zespół do spraw orzekania')) return 'wzon'
  if (name.includes('ministerstwo')) return 'ministry'
  return 'register'
}

const executionCapabilities: Record<string, string[]> = {
  'ZUS': ['Wyrejestrowanie płatnika i osób ubezpieczonych', 'Przyznanie i uruchomienie wypłaty 800+', 'Rozliczenie i wypłata zasiłku pogrzebowego', 'Przyznanie i wypłata świadczenia wspierającego'],
  'Urząd skarbowy': ['Złożenie i rozliczenie VAT-Z', 'Zamknięcie i wyrejestrowanie kasy fiskalnej', 'Złożenie PCC-3 i płatność podatku', 'Rozliczenie SD-Z2', 'Złożenie odpowiedzi i zamknięcie wezwania'],
  'Ministerstwo Rozwoju i Technologii': ['Złożenie CEIDG-1 i wykreślenie działalności', 'Przekazanie danych do ZUS'],
  'Urząd stanu cywilnego': ['Rejestracja urodzenia, wydanie aktu i nadanie PESEL', 'Rejestracja zgonu i wydanie aktu'],
  'Urząd gminy': ['Zapisanie meldunku', 'Złożenie i rozliczenie IN-1', 'Uzyskanie decyzji o warunkach zabudowy', 'Wydanie nowego dowodu osobistego'],
  'Sąd rejonowy': ['Uzyskanie potwierdzenia dziedziczenia', 'Wykonanie wpisu własności w księdze wieczystej'],
  'Starosta (starostwo powiatowe)': ['Wydanie pozwolenia na budowę', 'Rejestracja pojazdu i wydanie dokumentów'],
  'Urząd wojewódzki': ['Wydanie i dostarczenie nowego paszportu'],
  'Ministerstwo Cyfryzacji': ['Synchronizacja danych i aktualizacja rejestrów'],
  'Powiatowy inspektorat nadzoru budowlanego': ['Przyjęcie zawiadomienia i zapis rozpoczęcia robót'],
  'Wojewódzki zespół do spraw orzekania o niepełnosprawności': ['Przeprowadzenie oceny i wydanie ostatecznej decyzji o poziomie wsparcia'],
}

export const institutionAgents: InstitutionAgent[] = Array.from(
  scenarios.flatMap((scenario) => scenario.tasks.map((task) => ({ scenario, task })))
    .reduce((agents, { task }) => {
      const institution = canonicalInstitution(task.institution)
      const id = institution.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const current = agents.get(institution) ?? { id, institution, portrait: portraitFor(institution), capabilities: [], taskIds: [] }
      for (const capability of executionCapabilities[institution] ?? ['Wykonanie potwierdzonych czynności urzędowych']) if (!current.capabilities.includes(capability)) current.capabilities.push(capability)
      if (!current.taskIds.includes(task.id)) current.taskIds.push(task.id)
      agents.set(institution, current)
      return agents
    }, new Map<string, InstitutionAgent>())
    .values(),
)

export function agentForInstitution(institution: string) {
  const canonical = canonicalInstitution(institution)
  return institutionAgents.find((agent) => agent.institution === canonical)
}

export function hasAgentScope(institution: string, capabilities: string[], grantedScopes: string[]) {
  const agent = agentForInstitution(institution)
  return Boolean(agent && capabilities.every((capability) => agent.capabilities.includes(capability) && grantedScopes.includes(capability)))
}
