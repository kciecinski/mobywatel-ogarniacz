import { expect, test } from '@playwright/test'
import { artifactsForReceipt } from '../src/artifacts'
import { applyFlowEvent, projectFlow } from '../src/flow'
import { scenarios, type Case } from '../src/scenario'

for (const scenario of scenarios) test(`authorship survives restore and overview: ${scenario.title}`, async ({ page }) => {
  let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
  for (let guard = 0; guard < 200; guard++) {
    const flow = projectFlow(current)
    const step = flow.steps[flow.index]
    if (flow.phase === 'done') break
    if (flow.phase === 'question') {
      const question = flow.questions[flow.questionIndex]
      current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
    } else if (flow.phase === 'proposal') current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
    else if (flow.phase === 'processing') {
      const limit = step.unavailable && flow.attempts[step.id] === 1 ? 1 : step.tools.length
      current = applyFlowEvent(current, flow.toolIndex < limit ? { kind: 'tool', step: step.id, tool: step.tools[flow.toolIndex].name } : { kind: 'settled', step: step.id })
    } else if (flow.phase === 'receipt') current = applyFlowEvent(current, { kind: flow.blocked.includes(step.id) ? 'retry' : 'next', step: step.id })
    else throw new Error(`Unexpected phase ${flow.phase}`)
  }
  const flow = projectFlow(current)
  expect(flow.phase).toBe('done')
  await page.addInitScript(current => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases: [current] })), current)
  await page.goto('/')
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
  const receipts = flow.messages.filter(message => message.kind === 'receipt')
  await expect(page.locator('.coordinator-message .completed-tools')).toHaveCount(0)
  await expect(page.locator('.group-message .completed-tools')).toHaveCount(receipts.length)
  for (const receipt of receipts) {
    const article = page.locator('.group-message').filter({ hasText: receipt.text }).last()
    await expect(article.locator('.chat-sender')).toContainText(receipt.sender === 'Ministerstwo Rozwoju i Technologii' ? 'Agent CEIDG' : receipt.sender === 'Urząd skarbowy' ? 'Agent urzędu skarbowego' : receipt.sender)
  }
  await page.goto('/#przeglad')
  await expect(page.getByRole('heading', { name: 'Twoje sprawy', exact: true, level: 1 })).toBeVisible()
  await expect(page.locator('.case-status')).toHaveText('Załatwiona')
  const artifacts = flow.messages.flatMap(message => artifactsForReceipt(message, flow.steps.find(step => step.id === message.step)))
  await expect(page.locator('.case-card-documents .artifact-download')).toHaveCount(artifacts.length)
})
