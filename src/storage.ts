import { documentQuestionIds } from './input-contracts'
import { scenarios, type Case } from './scenario'
import { applyFlowEvent, projectFlow, validFlowEvents } from './flow'

export type Workspace = { cases: Case[]; selectedCaseId: number | null }
export const emptyWorkspace = (): Workspace => ({ cases: [], selectedCaseId: null })
const key = 'ogarniacz-data-contract-v5'

// Older saves asked for document fields separately. Keep their confirmed operations,
// but replay the existing upload/answer authorizations in the new question order.
function reorderDocumentAnswers(current: Case): Case {
  if (!Array.isArray(current.flow) || current.flow.length > 500) return current
  const boundary = current.flow.findIndex(event => event.kind !== 'answer')
  const answers = current.flow.slice(0, boundary < 0 ? undefined : boundary)
  const operations = boundary < 0 ? [] : current.flow.slice(boundary)
  const byQuestion = new Map(answers.filter(event => event.kind === 'answer').map(event => [event.question, event]))
  if (byQuestion.size !== answers.length) return current
  let updated: Case = { ...current, flow: [] }
  for (let guard = 0; guard < 50; guard++) {
    const flow = projectFlow(updated)
    if (flow.phase !== 'question') break
    const id = flow.questions[flow.questionIndex].id
    const answer = byQuestion.get(id)
    if (!answer) break
    const next = applyFlowEvent(updated, answer)
    if (next === updated) return current
    byQuestion.delete(id)
    updated = next
  }
  const knownQuestions = new Set(projectFlow(updated).questions.map(question => question.id))
  if ([...byQuestion].some(([id, event]) => !knownQuestions.has(id) && !(documentQuestionIds.has(id) && event.kind === 'answer' && event.value === id))) return current
  const candidate = { ...updated, flow: [...updated.flow!, ...operations] }
  return validFlowEvents(candidate) ? candidate : current
}

// Replay user-authorized events instead of trusting saved outcomes or timers.
export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyWorkspace()
    const saved = JSON.parse(raw)
    if (saved?.version !== 5 || !Array.isArray(saved.cases) || saved.cases.length > 100) return emptyWorkspace()
    const cases: Case[] = []
    for (const value of saved.cases) {
      if (value?.fullRoute !== undefined && typeof value.fullRoute !== 'boolean') return emptyWorkspace()
      if (value?.demo !== undefined && !['correction', 'timeline'].includes(value.demo)) return emptyWorkspace()
      if (!value || !Number.isSafeInteger(value.id) || value.id < 1 || !scenarios.some(scenario => scenario.id === value.scenarioId)) return emptyWorkspace()
      let current: Case = { id: value.id, scenarioId: value.scenarioId, demo: value.demo, fullRoute: value.fullRoute, flow: value.flow, events: [], history: [{ kind: 'started' }] }
      if (!validFlowEvents(current)) current = reorderDocumentAnswers(current)
      if (!validFlowEvents(current)) return emptyWorkspace()
      const reconstructed = current.flow!.reduce(applyFlowEvent, { ...current, flow: [] })
      cases.push(reconstructed)
    }
    if (new Set(cases.map(entry => entry.id)).size !== cases.length) return emptyWorkspace()
    if (saved.selectedCaseId !== null && !cases.some(entry => entry.id === saved.selectedCaseId)) return emptyWorkspace()
    return { cases, selectedCaseId: saved.selectedCaseId }
  } catch { return emptyWorkspace() }
}

export function saveWorkspace(workspace: Workspace): void {
  try {
    if (!workspace.cases.length) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify({ version: 5, selectedCaseId: workspace.selectedCaseId, cases: workspace.cases.map(entry => ({ id: entry.id, scenarioId: entry.scenarioId, ...(entry.fullRoute ? { fullRoute: true } : {}), ...(entry.demo ? { demo: entry.demo } : {}), flow: entry.flow ?? [] })) }))
  } catch { /* A session remains usable if browser storage is unavailable. */ }
}
