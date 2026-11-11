import { expect, test } from '@playwright/test'
import { applyFlowEvent, projectFlow, validFlowEvents, type FlowStep } from '../src/flow'
import { scenarios, type Case } from '../src/scenario'
import { artifactsForReceipt } from '../src/artifacts'
import { answerQuestions } from './chat-helpers'

function collect(demo: 'correction' | 'timeline') {
  let current: Case = { id: 1, scenarioId: demo === 'correction' ? 'buying-car' : 'building-house', demo, events: [], flow: [] }
  for (let guard = 0; projectFlow(current).phase === 'question' && guard < 50; guard++) {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
  }
  return current
}
function execute(current: Case, step: FlowStep, limit = step.tools.length) {
  current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
  for (const tool of step.tools.slice(0, limit)) current = applyFlowEvent(current, { kind: 'tool', step: step.id, tool: tool.name })
  return applyFlowEvent(current, { kind: 'settled', step: step.id })
}

test('correction recalculates payment and requires a new explicit confirmation', () => {
  let current = collect('correction')
  const step = projectFlow(current).steps[0]
  current = applyFlowEvent(current, { kind: 'edit', step: step.id })
  expect(applyFlowEvent(current, { kind: 'confirm', step: step.id })).toBe(current)
  current = applyFlowEvent(current, { kind: 'correct', step: step.id })
  const flow = projectFlow(current)
  expect(flow.phase).toBe('proposal')
  expect(flow.completed).toHaveLength(0)
  expect(flow.steps[0].tools.find(tool => tool.name === 'payments.execute_mock_transfer')?.input.amount_pln).toBe('480')
  expect(flow.origins.vehicle_value.kind).toBe('message')
  expect(validFlowEvents(current)).toBe(true)
  expect(projectFlow(JSON.parse(JSON.stringify(current))).data.vehicle_value).toBe('24000')
})

test('sent and delivered statuses cannot generate a decision or downloadable permit', () => {
  let current = collect('timeline')
  let flow = projectFlow(current)
  current = execute(current, flow.steps[0])
  current = applyFlowEvent(current, { kind: 'next', step: flow.steps[0].id })
  flow = projectFlow(current)
  const permit = flow.steps[flow.index]
  expect(permit.id).toBe('permit-plan')
  current = execute(current, permit, permit.tools.length - 1)
  flow = projectFlow(current)
  expect(flow.phase).toBe('waiting')
  expect(flow.timelineStage).toBe('sent')
  expect(flow.generated.building_permit).toBeUndefined()
  expect(artifactsForReceipt(flow.messages.at(-1)!, permit)).toHaveLength(0)
  expect(applyFlowEvent(current, { kind: 'next', step: permit.id })).toBe(current)
  current = applyFlowEvent(current, { kind: 'advance-time', step: permit.id })
  expect(projectFlow(current).timelineStage).toBe('received')
  expect(projectFlow(current).completed).not.toContain(permit.id)
  current = applyFlowEvent(current, { kind: 'advance-time', step: permit.id })
  expect(projectFlow(current).generated.building_permit).toBeUndefined()
  current = applyFlowEvent(current, { kind: 'tool', step: permit.id, tool: permit.tools.at(-1)!.name })
  current = applyFlowEvent(current, { kind: 'settled', step: permit.id })
  flow = projectFlow(current)
  expect(flow.generated.building_permit).toBeTruthy()
  expect(flow.messages.filter(message => message.kind === 'status')).toHaveLength(2)
  expect(flow.messages.some(message => message.kind === 'timeskip')).toBe(true)
  expect(validFlowEvents(current)).toBe(true)
})

test('home has three recommended paths and catalog only lists agents', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.featured-paths > button')).toHaveCount(3)
  await page.setViewportSize({ width: 320, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'shots/mobywatel-home-320.png', fullPage: true })
  await page.goto('/#agenci')
  await expect(page.locator('.agent-catalog-card').first()).toBeVisible()
  await expect(page.locator('.agent-catalog button,.agent-catalog input')).toHaveCount(0)
  await expect(page.locator('.agent-catalog')).not.toContainText('Niepołączony')
})

test('correction example is discoverable and survives refresh without submitting', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Sprawdź też inne sytuacje', { exact: true }).click()
  await page.getByRole('button', { name: /Popraw dane przed wysłaniem/ }).click()
  const scenario = scenarios.find(scenario => scenario.id === 'buying-car')!
  await answerQuestions(page, scenario, scenario.answers[0].id)
  await page.locator('.flow-active').getByRole('button', { name: 'Popraw dane', exact: true }).click()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'editing')
  await expect(page.getByRole('textbox')).toHaveValue('Popraw wartość rynkową auta na 24 000 zł.')
  await page.getByRole('button', { name: 'Wyślij wiadomość', exact: true }).click()
  await expect(page.locator('.flow-active')).toContainText('480 zł')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Popraw dane przed wysłaniem' })).toBeVisible()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
  await expect(page.locator('[data-tool-state]')).toHaveCount(0)
})

test('timeline example restores an awaiting case and later provides the permit', async ({ page }) => {
  let current = collect('timeline')
  const first = projectFlow(current).steps[0]
  current = execute(current, first)
  current = applyFlowEvent(current, { kind: 'next', step: first.id })
  const permit = projectFlow(current).steps[1]
  current = execute(current, permit, permit.tools.length - 1)
  await page.addInitScript(value => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases: [value] })), current)
  await page.goto('/')
  await expect(page.locator('.flow-active')).toContainText('decyzji jeszcze nie ma')
  await expect(page.locator('.flow-active .artifact-download')).toHaveCount(0)
  await expect(page.locator('.flow-active')).toContainText('Wniosek doręczony')
  await expect(page.locator('.time-event')).toBeVisible()
  await expect(page.locator('.group-message').filter({ hasText: 'Pozwolenie na budowę wydane' }).getByRole('button', { name: /Pozwolenie na budowę/ })).toBeVisible()
})
