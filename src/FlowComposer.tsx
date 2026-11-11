import { useEffect, useRef, useState } from 'react'
import type { FlowAttachment, FlowEvent } from './flow'

export type ComposerChoice = { id: string; label: string; text: string; event: FlowEvent; attachments?: FlowAttachment[] }
export function AttachmentCard({ attachment, queued = false, onOpen }: { attachment: FlowAttachment; queued?: boolean; onOpen: (attachment: FlowAttachment) => void }) {
  return <button type="button" className="chat-attachment" aria-label={`Podgląd załącznika: ${attachment.name}`} onClick={() => onOpen(attachment)}><span className="attachment-file-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 3v5h4M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.4"/></svg><small>{attachment.mime === 'application/pdf' ? 'PDF' : 'JPG'}</small></span><span><strong>{attachment.name}</strong><span>{attachment.size}{queued ? ' · Do wysłania' : ''}</span></span></button>
}

export function FlowComposer({ choices, busy, onSend, onAttachment, onHeight }: { choices: ComposerChoice[]; busy: boolean; onSend: (event: FlowEvent) => void; onAttachment: (attachment: FlowAttachment) => void; onHeight: (height: number) => void }) {
  const dock = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!dock.current) return
    const observer = new ResizeObserver(() => { if (dock.current) onHeight(Math.ceil(dock.current.getBoundingClientRect().height)) })
    observer.observe(dock.current)
    return () => observer.disconnect()
  }, [onHeight])
  const [selectedId, setSelectedId] = useState(choices[0]?.id ?? '')
  const selected = choices.find(choice => choice.id === selectedId)
  const submit = () => { if (!busy && selected) onSend(selected.event) }
  return <div ref={dock} className="flow-composer-dock"><form className="flow-composer" aria-label="Twoja wiadomość" onSubmit={event => { event.preventDefault(); submit() }}>

    {choices.length > 1 && <div className="composer-choices" role="group" aria-label="Wybierz treść wiadomości">{choices.map(choice => <button key={choice.id} type="button" aria-pressed={choice.id === selectedId} onClick={() => setSelectedId(choice.id)}>{choice.label}</button>)}</div>}
    <textarea id="flow-message-input" aria-label="Twoja wiadomość" readOnly rows={selected?.text.includes('\n') ? 3 : 2} value={selected?.text ?? ''} placeholder={busy ? 'Poczekaj na odpowiedź agenta…' : ''} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} />
    {!!selected?.attachments?.length && <div className="composer-attachments" aria-label="Załączniki do wysłania">{selected.attachments.map(attachment => <AttachmentCard key={attachment.name} attachment={attachment} queued onOpen={onAttachment} />)}</div>}
    <div className="composer-send-row"><button type="submit" className="composer-send" aria-label="Wyślij wiadomość" disabled={busy || !selected}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div>
  </form></div>
}
