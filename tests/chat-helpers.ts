import { expect, type Page } from '@playwright/test'
import { applyFlowEvent, projectFlow, resolveInputText } from '../src/flow'
import { scenarios, type Case } from '../src/scenario'

export async function sendReply(page: Page, text?: string) {
  if (text === 'Dalej') { await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', /proposal|done/); return }
  if (text && await page.locator('.message-actions').getByRole('button', { name: text, exact: true }).count()) { await page.locator('.message-actions').getByRole('button', { name: text, exact: true }).click(); return }
  const composer = page.getByRole('form', { name: 'Twoja wiadomość', exact: true })
  if (text) {
    const option = composer.getByRole('button', { name: text, exact: true })
    if (await option.count()) await option.click()
    else await expect(composer.getByRole('textbox')).toHaveValue(text)
  }
  await composer.getByRole('button', { name: 'Wyślij wiadomość', exact: true }).click()
}

export async function answerQuestions(page: Page, scenario: (typeof scenarios)[number], answerId: string, employment = 'does-not-employ') {
  let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
  for (let guard = 0; projectFlow(current).phase === 'question' && guard < 50; guard++) {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    const option = question.id === 'employment' ? question.options.find(option => option.value === employment)! : question.id === 'answer' ? question.options.find(option => option.value === answerId)! : question.options[0]
    if (question.presentation === 'action') {
      await expect(page.getByRole('form', { name: 'Twoja wiadomość', exact: true })).toHaveCount(0)
      await page.locator('.flow-active .message-actions').getByRole('button', { name: option.label, exact: true }).click()
      current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: option.value })
      continue
    }
    const composer = page.getByRole('form', { name: 'Twoja wiadomość', exact: true })
    if (question.options.length > 1) await composer.getByRole('button', { name: option.label, exact: true }).click()
    await expect(composer.getByRole('textbox')).toHaveValue(resolveInputText(option.message ?? option.label, flow.data))
    await sendReply(page)
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: option.value })
  }
  return projectFlow(current)
}
