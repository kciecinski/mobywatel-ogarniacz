import { expect, test } from '@playwright/test'
import { applyFlowEvent, projectFlow, validFlowEvents } from '../src/flow'
import type { Case } from '../src/scenario'

function buildCase(scenarioId: string, id: number, demo?: Case['demo']) {
  let current: Case = { id, scenarioId, fullRoute: true, demo, events: [], flow: [] }
  for (let guard = 0; guard < 250; guard++) {
    const flow = projectFlow(current)
    if (flow.phase === 'done' || flow.phase === 'waiting') return current
    const step = flow.steps[flow.index]
    if (flow.phase === 'question') {
      const question = flow.questions[flow.questionIndex]
      current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
    } else if (flow.phase === 'proposal') current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
    else if (flow.phase === 'processing') {
      const limit = step.tools.length - (demo === 'timeline' && step.id === 'permit-plan' && flow.timelineStage !== 'decided' ? 1 : 0)
      current = applyFlowEvent(current, flow.toolIndex < limit ? { kind: 'tool', step: step.id, tool: step.tools[flow.toolIndex].name } : { kind: 'settled', step: step.id })
    } else if (flow.phase === 'receipt') current = applyFlowEvent(current, { kind: 'next', step: step.id })
    else throw new Error(flow.phase)
  }
  throw new Error('Case did not finish')
}

test('full routes retain every institutional step without silently selecting the short branch', () => {
  const closing = projectFlow(buildCase('closing-business', 1))
  expect(closing.steps.map(step => step.id)).toEqual(['zus-consent', 'ceidg-plan', 'employees-zus', 'cash-register-close', 'vat-plan'])
  const house = projectFlow(buildCase('building-house', 2))
  expect(house.steps.map(step => step.id)).toEqual(['mpzp-plan', 'wz-plan', 'permit-plan', 'notice-plan'])
  expect(closing.completed).toHaveLength(closing.steps.length)
  expect(house.completed).toHaveLength(house.steps.length)
  expect(validFlowEvents(buildCase('childbirth', 3))).toBe(true)
})

test('case cards show statuses and downloadable files; completion offers a new case and keeps previous ones', async ({ page }) => {
  const completed = buildCase('closing-business', 1)
  const waiting = buildCase('building-house', 3, 'timeline')
  const pending: Case = { id: 2, scenarioId: 'childbirth', flow: [], events: [] }
  await page.addInitScript(cases => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases })), [completed, pending, waiting])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#przeglad')
  await expect(page.getByRole('heading', { name: 'Twoje sprawy', exact: true, level: 1 })).toBeVisible()
  await expect(page.locator('.case-card')).toHaveCount(3)
  await expect(page.locator('.case-status-done')).toHaveText('Załatwiona')
  await expect(page.locator('.case-status-waiting')).toHaveText('Czeka na urząd')
  await expect(page.locator('.case-status-question')).toHaveText('Czeka na Ciebie')
  const done = page.getByRole('article', { name: 'Zamknięcie firmy', exact: true })
  await expect(done.getByRole('button', { name: /UPO zgłoszenia VAT-Z/ })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await done.getByRole('button', { name: /UPO zgłoszenia VAT-Z/ }).click()
  expect((await downloadPromise).suggestedFilename()).toContain('vat-z')
  await expect(page.locator('footer')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'shots/cases-overview-390.png', fullPage: true })
  await done.getByRole('button', { name: 'Przejdź do sprawy' }).click()
  const newCase = page.locator('.case-complete-actions').getByRole('button', { name: 'Nowa sprawa do załatwienia' })
  await expect(newCase).toBeVisible()
  await newCase.click()
  await expect(page.locator('.featured-paths')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ogarniacz-data-contract-v5')!).cases.length)).toBe(3)
})

test('featured business path proposes the full variant but preserves user choice', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rozpocznij: Zamknięcie firmy' }).click()
  await expect(page.getByRole('textbox')).toHaveValue(/zatrudniam pracowników/i)
  await expect(page.getByRole('button', { name: 'Nie zatrudniam pracowników', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('textbox')).toHaveValue(/zatrudniam pracowników/i)
})
