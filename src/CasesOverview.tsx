import { projectFlow, type FlowProjection } from './flow'
import { scenarios, type Case } from './scenario'
import { artifactsForReceipt } from './artifacts'
import { ArtifactDownloads } from './ArtifactDownloads'
import { specialDemos } from './showcase'
import type { RefObject } from 'react'

export function caseStatus(flow: FlowProjection) {
  if (flow.phase === 'done') return 'Załatwiona'
  if (flow.phase === 'waiting') return 'Czeka na urząd'
  if (flow.phase === 'processing') return 'Agent działa'
  if (flow.phase === 'paused') return 'Wstrzymana'
  if (flow.blocked.length) return 'Wymaga ponowienia'
  if (flow.phase === 'editing') return 'Popraw dane'
  return 'Czeka na Ciebie'
}

export function CasesOverview({ cases, titleRef, onOpen, onNew }: { cases: Case[]; titleRef: RefObject<HTMLHeadingElement | null>; onOpen: (id: number) => void; onNew: () => void }) {
  return <section className="cases-overview" aria-labelledby="overview-title">
    <div className="cases-overview-heading"><h1 id="overview-title" ref={titleRef} tabIndex={-1}>Twoje sprawy</h1><button type="button" className="case-new-action" onClick={onNew}>Nowa sprawa do załatwienia <span aria-hidden="true">＋</span></button></div>
    {!cases.length && <p>Nie masz jeszcze rozpoczętych spraw.</p>}
    <div className="case-cards">{[...cases].reverse().map(current => {
      const scenario = scenarios.find(entry => entry.id === current.scenarioId)!
      const flow = projectFlow(current)
      const artifacts = flow.messages.flatMap(message => artifactsForReceipt(message, flow.steps.find(step => step.id === message.step)))
      const lastReceipt = flow.messages.filter(message => message.kind === 'receipt').at(-1)
      const summary = flow.phase === 'done' ? flow.messages.at(-1)!.text.replace(/^Gotowe\. /, '').replace(/ Nie masz już nic do zrobienia[\s\S]*$/, '') : flow.phase === 'waiting' ? flow.timelineStage === 'sent' ? 'Wniosek wysłany. Agent czeka na potwierdzenie doręczenia.' : 'Wniosek jest w urzędzie. Agent pilnuje odpowiedzi i wróci z decyzją.' : flow.phase === 'editing' ? 'Poprawiasz dane dokumentu. Wysyłka czeka na ponowne potwierdzenie.' : lastReceipt?.text ?? (flow.phase === 'question' ? 'Ustalamy szczegóły i zbieramy dokumenty potrzebne do tej sprawy.' : 'Agent przygotował kolejny krok. Możesz wrócić do sprawy w dowolnej chwili.')
      return <article className="case-summary case-card" key={current.id} aria-labelledby={`summary-case-${current.id}`}>
        <div className="case-card-top"><span className="case-number">Sprawa {current.id}</span><span className={`case-status case-status-${flow.phase}`} role="status">{caseStatus(flow)}</span></div>
        <h2 id={`summary-case-${current.id}`}>{current.demo ? specialDemos[current.demo].title : scenario.title}</h2>
        <p className="case-card-summary">{summary}</p>
        {artifacts.length > 0 && <section className="case-card-documents" aria-label="Dokumenty do pobrania"><h3>Dokumenty do pobrania</h3><ArtifactDownloads artifacts={artifacts} caseId={current.id} /></section>}
        <div className="case-card-actions"><button type="button" onClick={() => onOpen(current.id)}>Przejdź do sprawy <span aria-hidden="true">↗</span></button></div>
      </article>
    })}</div>
  </section>
}
