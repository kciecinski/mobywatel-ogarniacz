import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { scenarios, type Case } from './scenario'
import { projectFlow, resolveInputText, resolveOptionAttachments, type FlowAttachment, type FlowEvent, type FlowStep, type FlowMessage } from './flow'

import { AttachmentCard, FlowComposer, type ComposerChoice } from './FlowComposer'
import { AgentThread, CloseIcon } from './AgentThread'
import { ArtifactDownloads } from './ArtifactDownloads'
import { specialDemos } from './showcase'
import { artifactsForReceipt, type Artifact } from './artifacts'

type Props = {
  current: Case
  onNew: () => void
  onEvent: (caseId: number, event: FlowEvent) => void
  renderPortrait: (institution: string) => ReactNode
  agentName: (institution: string) => string
  renderCoordinator: () => ReactNode
}
function WorkOrb() {
  const reduced = useReducedMotion()
  return <span className="work-orb" aria-hidden="true"><motion.svg viewBox="0 0 32 32" animate={reduced ? {} : { rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".18"/><path d="M16 4a12 12 0 0 1 12 12M16 28A12 12 0 0 1 4 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="m16 10 1.6 4.4L22 16l-4.4 1.6L16 22l-1.6-4.4L10 16l4.4-1.6L16 10Z" fill="currentColor"/></motion.svg></span>
}

function ToolTrace({ message, step }: { message: FlowMessage; step: FlowStep }) {
  const count = message.toolCount ?? 0
  const failed = Boolean(step.unavailable && message.attempt === 1 && count >= 1)
  const limit = step.unavailable && message.attempt === 1 ? 1 : step.tools.length
  const reduced = useReducedMotion()
  const current = count < limit ? step.tools[count] : undefined
  const calls = <ol className="mock-tool-list">{step.tools.slice(0, count).map((tool, index) => <li className={`mock-tool-call tool-${failed && index === 0 ? 'error' : 'complete'}`} data-tool-state={failed && index === 0 ? 'error' : 'complete'} key={tool.name}><div className="mock-tool-heading"><span aria-hidden="true">{failed && index === 0 ? '!' : '✓'}</span><span>{tool.label}</span></div><code>{tool.name}</code><details><summary>Dane wywołania</summary><pre>{JSON.stringify(tool.input, null, 2)}</pre><span className="tool-output-label">Odpowiedź narzędzia</span><pre>{JSON.stringify(failed && index === 0 ? { status: 'temporarily_unavailable', retryable: true } : tool.output, null, 2)}</pre></details></li>)}</ol>
  if (message.kind !== 'processing') return <details className="mock-tool-trace completed-tools"><summary>{failed ? 'Próba połączenia nie powiodła się' : `Wykonane działania (${count})`}</summary>{calls}</details>
  return <div className="ai-tool-stream" aria-label="Działania agenta"><AnimatePresence mode="wait" initial={false}><motion.div key={current?.name ?? 'settling'} className="ai-current-tool" data-tool-state={current ? 'running' : 'finishing'} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -4 }} transition={{ duration: .22 }}><div className="ai-tool-title"><WorkOrb /><span><strong>{current?.label ?? 'Odbieram potwierdzenie'}</strong><small>{current ? `Krok ${count + 1} z ${limit}` : 'Jeszcze chwila'}</small></span></div>{current && <><code>{current.name}</code><details className="tool-input-details"><summary>Dane wywołania</summary><pre>{JSON.stringify(current.input, null, 2)}</pre></details></>}</motion.div></AnimatePresence>{count > 0 && <details className="ai-finished-tools"><summary>{failed ? 'Połączenie przerwane' : `Ukończone czynności · ${count}`}</summary>{calls}</details>}</div>
}

export function FlowConversation({ current, onEvent, renderPortrait, agentName, renderCoordinator, onNew }: Props) {
  const scenario = scenarios.find(scenario => scenario.id === current.scenarioId)!
  const flow = projectFlow(current)
  const step = flow.steps[flow.index]
  const stepId = step?.id
  const toolIndex = flow.toolIndex
  const toolName = step?.tools[toolIndex]?.name
  const toolLimit = step?.unavailable && flow.attempts[step.id] === 1 ? 1 : (step?.tools.length ?? 0) - (flow.demo === 'timeline' && stepId === 'permit-plan' && flow.timelineStage !== 'decided' ? 1 : 0)
  const question = flow.questions[flow.questionIndex]
  const hasComposer = flow.phase === 'editing' || (flow.phase === 'question' && question?.presentation !== 'action')
  const questionAction = flow.phase === 'question' && question?.presentation === 'action'
  const [composerHeight, setComposerHeight] = useState(260)
  const [previewAttachment, setPreviewAttachment] = useState<FlowAttachment | null>(null)
  const [detailInstitution, setDetailInstitution] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const attachmentDialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const activeMessage = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (flow.phase !== 'processing' || !stepId) return
    const timer = window.setTimeout(() => onEvent(current.id, toolIndex < toolLimit && toolName ? { kind: 'tool', step: stepId, tool: toolName } : { kind: 'settled', step: stepId }), toolIndex < toolLimit ? 1400 : 650)
    return () => window.clearTimeout(timer)
  }, [current.id, flow.phase, stepId, toolIndex, toolName, toolLimit, onEvent])

  useEffect(() => {
    if (flow.phase !== 'waiting' || !stepId) return
    const timer = window.setTimeout(() => onEvent(current.id, { kind: 'advance-time', step: stepId }), flow.timelineStage === 'sent' ? 1800 : 2600)
    return () => window.clearTimeout(timer)
  }, [current.id, flow.phase, flow.timelineStage, stepId, onEvent])

  const canContinue = flow.phase === 'receipt' && !!step && !flow.blocked.includes(step.id)
  useEffect(() => {
    if (!canContinue || !stepId) return
    const timer = window.setTimeout(() => onEvent(current.id, { kind: 'next', step: stepId }), 1600)
    return () => window.clearTimeout(timer)
  }, [canContinue, current.id, stepId, onEvent])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (dialog.current?.open) return
      activeMessage.current?.focus({ preventScroll: true })
      activeMessage.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'instant' : 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [flow.messages.length, flow.phase, reduced])

  useEffect(() => {
    if (activeMessage.current === document.activeElement && !dialog.current?.open && !attachmentDialog.current?.open) activeMessage.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [composerHeight])

  useEffect(() => {
    if (detailInstitution && !dialog.current?.open) dialog.current?.showModal()
  }, [detailInstitution])

  function closeDetails() {
    dialog.current?.close()
    setDetailInstitution(null)
    opener.current?.focus()
  }
  const choices: ComposerChoice[] = []
  const choice = (kind: 'confirm' | 'next' | 'pause' | 'resume' | 'retry' | 'edit' | 'correct' | 'cancel-edit', label: string) => choices.push({ id: kind, label, text: label, event: { kind, step: step.id } })
  if (flow.phase === 'question') for (const option of question.options) choices.push({ id: option.value, label: option.label, text: resolveInputText(option.message ?? option.label, flow.data), attachments: resolveOptionAttachments(option, flow.data), event: { kind: 'answer', question: question.id, value: option.value } })
  if (flow.phase === 'proposal') { choice('confirm', step.confirm); if (flow.demo === 'correction' && stepId === 'car-pcc-plan' && flow.data.vehicle_value !== '24000') choice('edit', 'Popraw dane'); choice('pause', 'Nie teraz') }
  if (flow.phase === 'editing') { choice('correct', 'Popraw wartość rynkową auta na 24 000 zł.'); choice('cancel-edit', 'Zostaw dotychczasowe dane.') }
  if (flow.phase === 'receipt') {
    if (flow.blocked.includes(step.id)) { choice('retry', 'Spróbuj ponownie'); choice('pause', 'Nie teraz') }

  }
  if (flow.phase === 'paused') choice('resume', 'Wróćmy do tego')
  const openAttachment = (attachment: FlowAttachment) => { setPreviewAttachment(attachment); attachmentDialog.current?.showModal() }

  const artifactButtons = (artifacts: Artifact[]) => <ArtifactDownloads artifacts={artifacts} caseId={current.id} />
  const allArtifacts = flow.messages.flatMap(message => artifactsForReceipt(message, flow.steps.find(entry => entry.id === message.step)))

  const referenceResults = scenario.plan.filter(plan => flow.messages.some(message => message.step === plan.id && message.sender === detailInstitution)).flatMap(plan => scenario.results.filter(result => result.id === plan.resultId))
  const references = [...new Map(referenceResults.flatMap(result => [result.source, ...(result.additionalSources ?? [])]).map(source => [source.url, { url: source.url, title: source.title ?? source.institution, checkedAt: source.checkedAt }])).values()]
  const visited = flow.steps.filter(entry => flow.messages.some(message => message.step === entry.id))
  return <section className={`flow-conversation scenario-grid${hasComposer ? ' has-composer' : ''}`} style={{ '--composer-height': `${composerHeight}px` } as CSSProperties} aria-label="Sprawa" data-phase={flow.phase}>
    <div className="flow-heading"><h1>{current.demo ? specialDemos[current.demo].title : scenario.title}</h1><details className="conversation-context"><summary>O tej sprawie</summary><p>Dane i dokumenty trafiają do agentów dopiero po wysłaniu ich w sprawie.</p>{flow.data.applicant_name && <p>Udostępnione dane: {flow.data.applicant_name}</p>}</details></div>
    <div className="flow-messages">
      {flow.messages.map((message, index) => {
        if (message.kind === 'timeskip') return <div key={message.id} className="chat-event time-event">{message.text}</div>
        if (message.kind === 'extracted') return <details key={message.id} className="chat-event-document"><summary><span aria-hidden="true">✓</span> {message.text}</summary><dl>{Object.entries(message.fields ?? {}).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>
        if (message.kind === 'transferred' && message.from && message.target) return <div key={message.id} className="chat-event chat-event-transfer"><span aria-hidden="true">↗</span><span className="transfer-copy"><strong>{agentName(message.from)}</strong> → <strong>{agentName(message.target)}</strong><small>{message.text}</small></span></div>
        if ((message.kind === 'calling' || message.kind === 'joined') && message.target) return <div key={message.id} className={`chat-event chat-event-${message.kind}`}><span aria-hidden="true">{message.kind === 'calling' ? '↗' : '+'}</span> {message.kind === 'calling' ? <>Ogarniacz woła <strong>{agentName(message.target)}</strong></> : <><strong>{agentName(message.target)}</strong> {message.text}</>}</div>
        const active = index === flow.messages.length - 1
        const institution = !['Ty', 'Ogarniacz'].includes(message.sender)
        const messageStep = flow.steps.find(entry => entry.id === message.step)
        const content = <>
          <strong className="chat-sender">{institution ? agentName(message.sender) : message.sender}</strong>
          {message.kind === 'processing' ? <div className="visually-hidden" role="status">{messageStep?.tools[message.toolCount ?? 0]?.label ?? 'Zapisuję potwierdzenie'}</div> : <p>{message.text}</p>}
          {!!message.attachments?.length && <div className="message-attachments">{message.attachments.map(attachment => <AttachmentCard key={attachment.name} attachment={attachment} onOpen={openAttachment} />)}</div>}
          {message.kind === 'offer' && messageStep && <details className="source-disclosure flow-preview"><summary>{messageStep.kind === 'consent' ? 'Co dokładnie udostępnię?' : messageStep.kind === 'check' ? 'Co sprawdzę?' : 'Podgląd dokumentów i danych'}</summary><h3>{messageStep.title}</h3><ul>{messageStep.documents.map(document => <li key={document}>{document}</li>)}</ul><p className="source-note">Przykładowe dane. Potwierdzenie uruchamia lokalny przebieg demonstracyjny, bez połączenia z urzędem.</p></details>}
          {(message.kind === 'processing' || message.kind === 'receipt') && messageStep && <ToolTrace message={message} step={messageStep} />}
          {message.kind === 'receipt' && messageStep && artifactButtons(artifactsForReceipt(message, messageStep))}
          {message.kind === 'receipt' && messageStep && <details className="source-disclosure"><summary>{messageStep.unavailable && message.attempt === 1 ? 'Szczegóły próby' : 'Potwierdzenie i szczegóły'}</summary><p>Przebieg demonstracyjny: DEMO-{current.id}-{messageStep.id}. Nie jest urzędowym potwierdzeniem.</p><p>{messageStep.title}</p></details>}
        </>
        return <article key={message.id} ref={active ? activeMessage : undefined} tabIndex={active ? -1 : undefined} className={`conversation-message ${institution ? 'group-message' : message.sender === 'Ty' ? 'answer-message' : 'coordinator-message'}${active ? ' flow-active' : ''}`} aria-label={institution ? `Wiadomość: ${agentName(message.sender)}` : `Wiadomość: ${message.sender}`}>
          {institution ? <><button type="button" className="agent-avatar-open" aria-label={`Otwórz agenta: ${agentName(message.sender)}`} onClick={event => { opener.current = event.currentTarget; setDetailInstitution(message.sender) }}>{renderPortrait(message.sender)}</button><div className="agent-chat-bubble"><button className="message-open" type="button" aria-label={`Praca agenta: ${agentName(message.sender)}`} onClick={event => { opener.current = event.currentTarget; setDetailInstitution(message.sender) }}><span aria-hidden="true">↗</span></button><div className="agent-message-content">{content}</div>{active && choices.length > 0 && flow.phase !== 'question' && flow.phase !== 'editing' && <div className="message-actions">{choices.map(action => <button type="button" key={action.id} className={action.id === 'pause' ? 'action-secondary' : 'action-primary'} onClick={() => onEvent(current.id, action.event)}>{action.label}</button>)}</div>}</div></> : <>{message.sender === 'Ogarniacz' && renderCoordinator()}{content}{active && questionAction && <div className="message-actions">{choices.map(action => <button type="button" key={action.id} className="action-primary" onClick={() => onEvent(current.id, action.event)}>{action.label}</button>)}</div>}</>}
        </article>
      })}
    </div>
    {visited.length > 0 && <details className="chat-disclosure"><summary>Przebieg sprawy</summary><ol className="flow-checklist">{visited.map(entry => <li key={entry.id}>{entry.title}<span>{flow.completed.includes(entry.id) ? entry.kind === 'consent' ? 'Zgoda udzielona' : 'Potwierdzone' : flow.blocked.includes(entry.id) ? 'Do dokończenia' : 'W toku sprawy'}</span></li>)}</ol>{allArtifacts.length > 0 && <section className="case-artifacts" aria-labelledby="case-artifacts-title"><h3 id="case-artifacts-title">Dokumenty do pobrania</h3>{artifactButtons(allArtifacts)}</section>}</details>}
    {flow.phase === 'paused' && <div className="message-actions resume-actions">{choices.map(action => <button type="button" className="action-primary" key={action.id} onClick={() => onEvent(current.id, action.event)}>{action.label}</button>)}</div>}
    {flow.phase === 'done' && <div className="case-complete-actions"><button type="button" className="case-new-action" onClick={onNew}>Nowa sprawa do załatwienia <span aria-hidden="true">＋</span></button></div>}
    {hasComposer && <FlowComposer key={`${current.id}:${flow.phase}:${flow.messages.at(-1)?.id}`} choices={choices} busy={false} onSend={event => onEvent(current.id, event)} onAttachment={openAttachment} onHeight={setComposerHeight} />}
    <dialog ref={attachmentDialog} className="flow-dialog attachment-preview-dialog" aria-labelledby="attachment-preview-title" onClose={() => setPreviewAttachment(null)}>{previewAttachment && <><button type="button" className="flow-dialog-close dialog-x" aria-label="Zamknij podgląd załącznika" onClick={() => attachmentDialog.current?.close()}><CloseIcon /></button><span className="attachment-pdf-label">{previewAttachment.mime === 'application/pdf' ? 'PDF' : 'JPG'} · symulowany załącznik</span><h2 id="attachment-preview-title">{previewAttachment.title}</h2><p>{previewAttachment.name} · {previewAttachment.size}</p><dl>{Object.entries(previewAttachment.fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="source-note">Fikcyjny dokument do demonstracji. Nie wysłano pliku do żadnego urzędu.</p></>}</dialog>
    <dialog ref={dialog} className="flow-dialog agent-thread-dialog" aria-labelledby="flow-detail-title" onCancel={closeDetails} onClose={() => { setDetailInstitution(null); opener.current?.focus() }}>
      <button type="button" className="flow-dialog-close dialog-x" aria-label="Zamknij podgląd agenta" onClick={closeDetails}><CloseIcon /></button>
      {detailInstitution && <AgentThread key={detailInstitution} institution={detailInstitution} flow={flow} caseId={current.id} name={agentName(detailInstitution)} portrait={renderPortrait(detailInstitution)} references={references} />}
    </dialog>
  </section>
}
