import { useEffect, useRef, type ReactNode } from 'react'
import type { FlowProjection, FlowStep } from './flow'
import { artifactsForReceipt } from './artifacts'
import { ArtifactDownloads } from './ArtifactDownloads'

export function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

export function AgentThread({ institution, flow, caseId, name, portrait, references }: { institution: string; flow: FlowProjection; caseId: number; name: string; portrait: ReactNode; references: { url: string; title: string; checkedAt: string }[] }) {
  const scroll = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const entries: ReactNode[] = []
  const delegated = new Set<string>()
  const shownTools = new Set<string>()
  const shownUsers = new Set<string>()
  const appendUser = (message: FlowProjection['messages'][number] | undefined) => {
    if (message?.sender !== 'Ty' || shownUsers.has(message.id)) return
    shownUsers.add(message.id)
    entries.push(<div key={`authorization-${message.id}`} className="agent-thread-user"><strong>Ty</strong><p>{message.text}</p></div>)
  }
  let latestStep: FlowStep | undefined
  let latestKind = ''
  let latestAttempt: number | undefined
  for (const [index, message] of flow.messages.entries()) {
    const step = flow.steps.find(step => step.id === message.step)
    if (message.sender !== institution || !step) continue
    latestStep = step
    latestKind = message.kind
    latestAttempt = message.attempt
    if (!delegated.has(step.id)) {
      delegated.add(step.id)
      entries.push(<div key={`task-${step.id}`} className="agent-thread-delegation"><strong>Ogarniacz</strong><p>Przekazuję zadanie: {step.title}.</p><details><summary>Przekazane dane i dokumenty</summary><dl>{step.dataSources.map(source => <div key={source.field}><dt>{source.label}</dt><dd>{source.value}<small>{source.source}</small></dd></div>)}</dl></details></div>)
    }
    const previous = flow.messages[index - 1]
    appendUser(previous)
    const response = <div key={`message-${message.id}`} className="agent-thread-message"><strong>{name}</strong><p>{message.text}</p></div>
    if (message.kind === 'offer') { entries.push(response); appendUser(flow.messages[index + 1]) }
    const count = message.toolCount ?? 0
    const failed = Boolean(step.unavailable && message.attempt === 1 && count >= 1)
    const limit = step.unavailable && message.attempt === 1 ? 1 : step.tools.length - (flow.demo === 'timeline' && step.id === 'permit-plan' && flow.timelineStage !== 'decided' ? 1 : 0)
    const visible = count + (message.kind === 'processing' && count < limit ? 1 : 0)
    step.tools.slice(0, visible).forEach((tool, toolIndex) => {
      const key = `${step.id}-${message.attempt ?? 0}-${toolIndex}`
      if (shownTools.has(key)) return
      shownTools.add(key)
      const running = toolIndex >= count
      const error = failed && toolIndex === 0
      entries.push(<div key={key} className={`agent-thread-tool${running ? ' is-running' : ''}`} data-agent-tool-state={running ? 'running' : error ? 'error' : 'complete'}><div className="agent-thread-tool-title"><span className="agent-thread-work" aria-hidden="true">{running ? '◌' : error ? '!' : '✓'}</span><span>{tool.label}</span></div><code>{tool.name}</code><details><summary>{running ? 'Dane wywołania' : 'Wywołanie i odpowiedź'}</summary><pre>{JSON.stringify(tool.input, null, 2)}</pre>{!running && <><span className="agent-thread-output">Odpowiedź narzędzia</span><pre>{JSON.stringify(error ? { status: 'temporarily_unavailable', retryable: true } : tool.output, null, 2)}</pre></>}</details></div>)
    })
    if (message.kind !== 'processing' && message.kind !== 'offer') entries.push(response)
    const artifacts = artifactsForReceipt(message, step)
    if (artifacts.length) entries.push(<ArtifactDownloads key={`files-${message.id}`} artifacts={artifacts} caseId={caseId} />)
  }
  const live = latestKind === 'processing'
  const failed = latestStep?.unavailable && latestAttempt === 1 && latestKind === 'receipt'
  const status = latestStep?.id === flow.steps[flow.index]?.id && flow.phase === 'paused' ? 'Wstrzymane' : latestStep?.kind === 'consent' && flow.completed.includes(latestStep.id) ? 'Zgoda udzielona' : live ? 'Pracuje' : latestKind === 'status' ? 'Czeka na urząd' : failed ? 'Połączenie przerwane' : latestKind === 'receipt' ? 'Zakończone' : 'Czeka na potwierdzenie'
  const signature = flow.messages.filter(message => message.sender === institution).map(message => `${message.id}:${message.kind}:${message.toolCount ?? 0}`).join('|')
  useEffect(() => {
    if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
  }, [signature])
  return <><header className="agent-thread-header">{portrait}<div><h2 id="flow-detail-title">{name}</h2><span role="status">{status}</span></div></header><div className="agent-thread-scroll" ref={scroll} onScroll={() => { const el = scroll.current; if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }} aria-label={`Przebieg pracy: ${name}`}>{entries}{latestStep && <details className="agent-thread-sources"><summary>Skąd mam dane do tego kroku?</summary><dl>{latestStep.dataSources.map(source => <div key={source.field}><dt>{source.label}</dt><dd>{source.value}<small>{source.source}</small></dd></div>)}</dl></details>}{references.length > 0 && <details className="agent-thread-sources"><summary>Informacje i źródła</summary>{references.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small> · sprawdzono {source.checkedAt}</small></p>)}</details>}</div><p className="agent-thread-caption">Podgląd tylko do odczytu · symulowany przebieg pracy agenta</p></>
}
