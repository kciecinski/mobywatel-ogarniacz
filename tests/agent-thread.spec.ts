import { expect, test } from '@playwright/test'
import { applyFlowEvent, projectFlow } from '../src/flow'
import type { Case } from '../src/scenario'

function ceidgCase(processing: boolean) {
  let current: Case = { id: 1, scenarioId: 'closing-business', events: [], flow: [] }
  while (projectFlow(current).phase === 'question') {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
  }
  current = applyFlowEvent(current, { kind: 'confirm', step: 'zus-consent' })
  if (processing) current = applyFlowEvent(current, { kind: 'confirm', step: 'ceidg-plan' })
  return current
}
async function seed(page: import('@playwright/test').Page, current: Case) {
  await page.addInitScript(value => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases: [value] })), current)
  await page.goto('/')
}

test('agent panel is a live readonly thread, keeps its agent after handoff and closes with X', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page, ceidgCase(true))
  const opener = page.getByRole('button', { name: 'Otwórz agenta: Agent CEIDG', exact: true }).last()
  await opener.click()
  const panel = page.getByRole('dialog', { name: 'Agent CEIDG', exact: true })
  await expect(panel).toBeVisible()
  await expect(panel.locator('.agent-thread-delegation')).toContainText('Przekazuję zadanie:')
  await expect(panel.locator('.agent-thread-user')).toContainText('Potwierdź wniosek o wykreślenie')
  await expect(panel.locator('[data-agent-tool-state="running"]')).toHaveCount(1)
  await expect(panel.getByRole('textbox')).toHaveCount(0)
  await expect(panel.locator('.message-actions')).toHaveCount(0)
  await expect(panel.getByText('ceidg.get_final_confirmation', { exact: true })).toHaveCount(0)
  await expect(panel.locator('[data-agent-tool-state="complete"]')).toHaveCount(5)
  await expect(panel.locator('.agent-thread-header [role="status"]')).toHaveText('Zakończone')
  await expect(panel.getByRole('heading', { name: 'Agent CEIDG', exact: true })).toBeVisible()
  await expect(panel.locator('.agent-thread-message')).toContainText(['Wniosek o wykreślenie', 'Wniosek przyjęty'])
  await panel.locator('.agent-thread-tool summary').first().click()
  await expect(panel.locator('.agent-thread-tool').first()).toContainText('verified')
  await page.screenshot({ path: 'shots/agent-thread-390.png' })
  await panel.getByRole('button', { name: 'Zamknij podgląd agenta', exact: true }).click()
  await expect(panel).not.toBeVisible()
  await expect(opener).toBeFocused()
})

test('opening proposal thread does not execute tools; Escape returns focus at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(page, ceidgCase(false))
  const opener = page.getByRole('button', { name: 'Otwórz agenta: Agent CEIDG', exact: true })
  await opener.click()
  const panel = page.getByRole('dialog', { name: 'Agent CEIDG', exact: true })
  await expect(panel.locator('[data-agent-tool-state]')).toHaveCount(0)
  await expect(panel.locator('.agent-thread-header [role="status"]')).toHaveText('Czeka na potwierdzenie')
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(opener).toBeFocused()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
})
