import { expect, test } from '@playwright/test'
import { scenarios, type Case } from '../src/scenario'
import { applyFlowEvent, projectFlow } from '../src/flow'
import { answerQuestions } from './chat-helpers'

test('a notarial act supplies property fields without asking the citizen to type them twice', async ({ page }) => {
  const scenario = scenarios.find(item => item.id === 'buying-flat')!
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Wszystkie tematy (12)' }).click()
  await page.getByRole('button', { name: 'Rozpocznij: Kupno mieszkania' }).click()
  const flow = await answerQuestions(page, scenario, scenario.answers[0].id)
  expect(flow.questions.some(question => question.id === 'property-details')).toBe(false)
  expect(flow.origins.land_register).toEqual({ kind: 'attachment', reference: 'akt-notarialny.pdf' })
  await page.locator('.chat-event-document summary').click()
  await expect(page.locator('.chat-event-document')).toContainText('DEMO-KW-001')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('birth record handoff only appears once the producing agent has finished', () => {
  let current: Case = { id: 1, scenarioId: 'childbirth', events: [], flow: [] }
  while (projectFlow(current).phase === 'question') {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
  }
  let flow = projectFlow(current)
  expect(flow.messages.filter(message => message.kind === 'transferred')).toHaveLength(0)
  const step = flow.steps[0]
  current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
  for (const tool of step.tools) current = applyFlowEvent(current, { kind: 'tool', step: step.id, tool: tool.name })
  current = applyFlowEvent(current, { kind: 'settled', step: step.id })
  current = applyFlowEvent(current, { kind: 'next', step: step.id })
  flow = projectFlow(current)
  const handoff = flow.messages.find(message => message.kind === 'transferred')!
  expect(handoff).toMatchObject({ from: step.institution, target: 'ZUS', transferStep: 'benefit-plan' })
  expect(handoff.text).toContain('Akt urodzenia')
  expect(flow.steps[1].tools[0].input.birth_record).toBe(flow.generated.birth_record)
  expect(projectFlow(JSON.parse(JSON.stringify(current))).messages.filter(message => message.kind === 'transferred')).toHaveLength(1)
})

test('previously saved document answers retain their case after the question order changes', async ({ page }) => {
  let current: Case = { id: 1, scenarioId: 'buying-flat', events: [], flow: [] }
  while (projectFlow(current).phase === 'question') {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
  }
  const answers = current.flow!.filter(event => event.kind === 'answer')
  current.flow = [...answers.filter(event => !['source-document', 'registry-access'].includes(event.question)), { kind: 'answer', question: 'property-details', value: 'property-details' }, answers.find(event => event.question === 'registry-access')!, answers.find(event => event.question === 'source-document')!]
  await page.addInitScript(value => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases: [value] })), current)
  await page.goto('/')
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
  await expect(page.locator('.chat-event-document')).toContainText('akt-notarialny.pdf')
})
