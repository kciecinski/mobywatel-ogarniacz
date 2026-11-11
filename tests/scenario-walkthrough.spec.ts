import { expect, test } from '@playwright/test'
import { scenarios } from '../src/scenario'
import { answerQuestions, sendReply } from './chat-helpers'

for (const scenario of scenarios) for (const answer of scenario.answers) {
  test(`browser: ${scenario.title} / ${answer.id} executes all actions`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Wszystkie tematy (12)', exact: true }).click()
    await page.getByRole('button', { name: `Rozpocznij: ${scenario.title}`, exact: true }).click()
    await expect(page.locator('.group-message')).toHaveCount(0)
    const collected = await answerQuestions(page, scenario, answer.id)
    const steps = collected.steps
    for (const step of steps) {
      await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'proposal')
      await expect(page.locator('.flow-active')).toContainText(step.offer)
      await expect(page.locator('.flow-active .mock-tool-trace')).toHaveCount(0)
      await sendReply(page, step.confirm)
      if (step.kind === 'consent') continue
      await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'processing')
      await expect(page.locator('.flow-active .ai-tool-stream')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Wyślij wiadomość' })).toHaveCount(0)
      const finalSuccess = step.id === steps.at(-1)?.id
      await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', step.unavailable ? 'receipt' : finalSuccess ? 'done' : 'receipt')
      if (step.unavailable) {
        await expect(page.locator('.flow-active [data-tool-state="error"]')).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Dalej', exact: true })).toHaveCount(0)
        await sendReply(page, 'Spróbuj ponownie')
        await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', finalSuccess ? 'done' : 'receipt')
      }
      await page.locator('.completed-tools > summary').last().click()
      await expect(page.locator('.completed-tools').last().locator('[data-tool-state="complete"]')).toHaveCount(step.tools.length)
      if (!finalSuccess) await sendReply(page, 'Dalej')
    }
    await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
    await expect(page.locator('.flow-active')).toContainText('Nie masz już nic do zrobienia')
    await page.reload()
    await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
  })
}
