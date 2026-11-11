import { expect, test } from '@playwright/test'
import { scenarios } from '../src/scenario'
import { applyFlowEvent, projectFlow } from '../src/flow'
import type { Case } from '../src/scenario'

test('profile sharing is explicit and agent arrival is shown before their first message', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Wszystkie tematy (12)' }).click()
  await page.getByRole('button', { name: 'Rozpocznij: Budowa domu' }).click()
  const question = page.locator('.flow-conversation')
  await expect(question).toHaveAttribute('data-phase', 'question')
  const composer = page.getByRole('form', { name: 'Twoja wiadomość' })
  await composer.getByRole('button', { name: scenarios.find(s => s.id === 'building-house')!.answers[0].label, exact: true }).click()
  await composer.getByRole('button', { name: 'Wyślij wiadomość' }).click()
  const profile = page.locator('.flow-active')
  await expect(profile).toContainText('danych z profilu')
  await expect(profile).toContainText('PESEL')
  await expect(page.getByRole('form', { name: 'Twoja wiadomość' })).toHaveCount(0)
  await expect(profile.getByRole('button', { name: /Udostępnij dane/ })).toBeVisible()
  await page.reload()
  await expect(page.locator('.flow-active')).toContainText('danych z profilu')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ogarniacz-data-contract-v5')!).cases[0].flow.some((event: {question?: string}) => event.question === 'applicant'))).toBe(false)
})

test('each change of agent is preceded by an invitation and a join event', () => {
  for (const scenario of scenarios) {
    let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
    for (let guard = 0; guard < 200; guard++) {
      const flow = projectFlow(current)
      if (flow.phase === 'done') break
      const step = flow.steps[flow.index]
      if (flow.phase === 'question') {
        const question = flow.questions[flow.questionIndex]
        current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
      } else if (flow.phase === 'proposal') current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
      else if (flow.phase === 'processing') {
        const limit = step.unavailable && flow.attempts[step.id] === 1 ? 1 : step.tools.length
        current = applyFlowEvent(current, flow.toolIndex < limit ? { kind: 'tool', step: step.id, tool: step.tools[flow.toolIndex].name } : { kind: 'settled', step: step.id })
      } else if (flow.phase === 'receipt') current = applyFlowEvent(current, { kind: flow.blocked.includes(step.id) ? 'retry' : 'next', step: step.id })
      else throw new Error(flow.phase)
    }
    const flow = projectFlow(current)
    expect(flow.phase).toBe('done')
    let previous = ''
    flow.messages.forEach((message, index) => {
      if (message.kind !== 'offer') return
      if (message.sender !== previous) {
        const arrivals = flow.messages.slice(0, index).filter(item => item.kind === 'calling' || item.kind === 'joined')
        expect(arrivals.at(-2)).toMatchObject({ kind: 'calling', target: message.sender })
        expect(arrivals.at(-1)).toMatchObject({ kind: 'joined', target: message.sender })
      }
      previous = message.sender
    })
    expect(projectFlow(JSON.parse(JSON.stringify(current))).messages).toEqual(flow.messages)
  }
})
