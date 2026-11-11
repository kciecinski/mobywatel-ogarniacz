import { expect, test } from '@playwright/test'
import { scenarios } from '../src/scenario'
import { answerQuestions, sendReply } from './chat-helpers'
const closing = scenarios[0]

async function startClosing(page: import('@playwright/test').Page, vat: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rozpocznij: Zamknięcie firmy' }).click()
  await expect(page.locator('.group-message')).toHaveCount(0)
  await answerQuestions(page, closing, vat)
}

test('closing requires contextual confirmation and hands off automatically after refresh', async ({ page }) => {
  await startClosing(page, 'vat-yes')
  await expect(page.locator('.flow-active')).toContainText('Ogarnę składki')
  await expect(page.locator('.group-message')).toHaveCount(1)
  await expect(page.locator('.chat-event-calling').first()).toContainText('Agent ZUS')
  await expect(page.locator('.chat-event-joined').first()).toContainText('dołącza do sprawy')
  await sendReply(page, 'OK, udostępnij datę agentowi ZUS')
  await expect(page.locator('.flow-active')).toContainText('Wniosek o wykreślenie firmy jest gotowy')
  await page.waitForTimeout(1700)
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
  await expect(page.locator('.flow-active')).not.toContainText('Wniosek przyjęty')
  await sendReply(page, 'Potwierdź wniosek o wykreślenie')
  await expect(page.locator('.flow-active .ai-tool-stream')).toContainText('ceidg.read_case_data')
  await page.reload()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'receipt')
  await expect(page.locator('.flow-active')).toContainText('Wniosek przyjęty')
  await sendReply(page, 'Dalej')
  await sendReply(page, 'Potwierdź zgłoszenie VAT-Z')
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
  await expect(page.locator('.flow-active')).toContainText('Firma zamknięta')
  await page.reload()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ogarniacz-data-contract-v5')!).cases[0].flow.filter((event: {kind: string; step: string}) => event.kind === 'confirm' && event.step === 'ceidg-plan').length)).toBe(1)
})

test('pausing does not submit; no-VAT branch omits the tax office', async ({ page }) => {
  await startClosing(page, 'vat-no')
  await sendReply(page, 'Nie teraz')
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'paused')
  await page.reload()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'paused')
  await sendReply(page, 'Wróćmy do tego')
  await sendReply(page, 'OK, udostępnij datę agentowi ZUS')
  await sendReply(page, 'Potwierdź wniosek o wykreślenie')
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
  await expect(page.getByRole('article', { name: /Wiadomość: Agent urzędu skarbowego/ })).toHaveCount(0)
})

test('old saves cannot populate a new conversation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ogarniacz-actions-v3', JSON.stringify({ version: 3, cases: [{ id: 1, scenarioId: 'closing-business', flow: [] }], selectedCaseId: 1 })))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Rozpocznij: Zamknięcie firmy' })).toBeVisible()
  await expect(page.locator('.group-message')).toHaveCount(0)
})

test('document details do not confirm a request; focus returns on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startClosing(page, 'vat-yes')
  await sendReply(page, 'OK, udostępnij datę agentowi ZUS')
  await page.locator('.flow-active summary').click()
  await expect(page.locator('.flow-active')).toContainText('Właściciel: Marta Nowak')
  const messageButton = page.locator('.flow-active .message-open')
  await messageButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(messageButton).toBeFocused()
  await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
