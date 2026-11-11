export type SpecialDemo = 'correction' | 'timeline'
export const goldenPaths: Record<string, { order: string; description: string }> = {
  'closing-business': { order: '01', description: 'Jedna sprawa, CEIDG, ZUS i skarbówka. Od zgód do kompletu potwierdzeń.' },
  childbirth: { order: '02', description: 'Akt i PESEL trafiają z USC do ZUS. Dane podajesz tylko raz.' },
  'building-house': { order: '03', description: 'Dokumenty przechodzą między gminą, starostą i nadzorem budowlanym.' },
}
export const specialDemos: Record<SpecialDemo, { title: string; scenarioId: string; description: string }> = {
  correction: { title: 'Popraw dane przed wysłaniem', scenarioId: 'buying-car', description: 'Zmień wartość auta i zobacz nowe wyliczenie PCC przed zatwierdzeniem.' },
  timeline: { title: 'Od wysłania do decyzji', scenarioId: 'building-house', description: 'Zobacz różnicę między wysłaniem wniosku, doręczeniem i decyzją urzędu.' },
}
