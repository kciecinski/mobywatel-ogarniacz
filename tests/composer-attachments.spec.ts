import { expect, test } from '@playwright/test'
import { scenarios } from '../src/scenario'
import { applyFlowEvent, projectFlow } from '../src/flow'
import type { Case } from '../src/scenario'
import { sendReply } from './chat-helpers'

test('readonly composer selection is a draft until Send; Enter sends exactly once', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rozpocznij: Zamknięcie firmy' }).click()
  const composer = page.getByRole('form', { name: 'Twoja wiadomość', exact: true })
  const input = composer.getByRole('textbox')
  await expect(input).toHaveAttribute('readonly', '')
  const before = await page.locator('.flow-messages article').count()
  await composer.getByRole('button', { name: 'Nie zatrudniam pracowników' }).click()
  await expect(input).toHaveValue('Nie zatrudniam pracowników')
  await expect(page.locator('.flow-messages article')).toHaveCount(before)
  await input.focus()
  await page.keyboard.type('Nie mogę dopisać własnej treści')
  await expect(input).toHaveValue('Nie zatrudniam pracowników')
  await page.keyboard.press('Enter')
  await expect(page.locator('.flow-messages article')).toHaveCount(before + 2)
  await expect(page.locator('.flow-messages .answer-message').last()).toContainText('Nie zatrudniam pracowników')
  await expect(page.locator('.group-message')).toHaveCount(0)
})

test('death document is queued, previewed and sent by the citizen before any agent sees its data', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Wszystkie tematy (12)' }).click()
  await page.getByRole('button', { name: 'Rozpocznij: Śmierć bliskiej osoby' }).click()
  await sendReply(page, 'Zgon nie został jeszcze zgłoszony')
  await page.locator('.flow-active').getByRole('button', { name: /Udostępnij dane:/ }).click() // Explicitly share the applicant profile.
  await sendReply(page, 'Maria Nowak · PESEL 11111111111')
  await expect(page.locator('.group-message')).toHaveCount(0)
  const composer = page.getByRole('form', { name: 'Twoja wiadomość', exact: true })
  await expect(composer.getByLabel('Załączniki do wysłania')).toContainText('karta-zgonu.pdf')
  await expect(page.locator('.flow-messages .chat-attachment')).toHaveCount(0)
  await composer.getByRole('button', { name: 'Podgląd załącznika: karta-zgonu.pdf' }).click()
  await expect(page.getByRole('dialog')).toContainText('Maria Nowak')
  await expect(page.getByRole('dialog')).toContainText('11111111111')
  await page.getByRole('button', { name: 'Zamknij podgląd załącznika' }).click()
  await expect(page.locator('.flow-messages .chat-attachment')).toHaveCount(0)
  await sendReply(page)
  await expect(page.locator('.flow-messages .answer-message .chat-attachment')).toContainText('karta-zgonu.pdf')
  await page.reload()
  await expect(page.locator('.flow-messages .chat-attachment')).toContainText('karta-zgonu.pdf')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('attachment metadata binds to the supplied deceased person and reaches tools only after send', () => {
  const scenario = scenarios.find(scenario => scenario.id === 'bereavement')!
  let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
  while (projectFlow(current).phase === 'question') {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    if (question.id === 'death-document') expect(Object.keys(flow.data).some(key => key.startsWith('file:'))).toBe(false)
    const option = question.id === 'deceased-person' ? question.options[1] : question.options[0]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: option.value })
  }
  const flow = projectFlow(current)
  const fileMessage = flow.messages.find(message => message.attachments?.some(file => file.name === 'karta-zgonu.pdf'))!
  expect(fileMessage.sender).toBe('Ty')
  expect(fileMessage.attachments![0].fields['Imię i nazwisko']).toBe('Maria Nowak')
  expect(flow.steps[0].tools[0].input.deceased_name).toBe('Maria Nowak')
  expect(flow.steps[0].tools[0].input['file:karta-zgonu.pdf']).toContain('11111111111')
})

test('tools advance slowly, show a single current call and hide future calls', async ({ page }) => {
  const { answerQuestions } = await import('./chat-helpers')
  await page.goto('/')
  await page.getByRole('button', { name: 'Rozpocznij: Zamknięcie firmy' }).click()
  await answerQuestions(page, scenarios[0], 'vat-yes')
  await sendReply(page, 'OK, udostępnij datę agentowi ZUS')
  await sendReply(page, 'Potwierdź wniosek o wykreślenie')
  await expect(page.locator('.ai-current-tool')).toHaveCount(1)
  await expect(page.locator('.ai-current-tool')).toContainText('ceidg.read_case_data')
  await page.waitForTimeout(500)
  await expect(page.locator('.ai-current-tool')).toContainText('ceidg.read_case_data')
  await expect(page.locator('.ai-current-tool')).toContainText('ceidg.submit_termination')
  await expect(page.locator('.ai-current-tool')).toHaveCount(1)
  await expect(page.locator('.ai-finished-tools > summary')).toContainText('1')
  await expect(page.locator('.ai-tool-stream code').filter({ hasText: 'zus.deregister_payer_and_owner' })).toHaveCount(0)
})
