import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { applyFlowEvent, projectFlow } from '../src/flow'
import { scenarios, type Case } from '../src/scenario'
import { artifactsForReceipt } from '../src/artifacts'

function preparedCase(scenarioId: string, finish: boolean, stopOnFailure = false) {
  let current: Case = { id: 1, scenarioId, events: [], flow: [] }
  for (let guard = 0; guard < 200; guard++) {
    const flow = projectFlow(current)
    if (flow.phase === 'done') break
    const step = flow.steps[flow.index]
    if (flow.phase === 'question') {
      const question = flow.questions[flow.questionIndex]
      const option = question.options[0]
      current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: option.value })
    } else if (flow.phase === 'proposal') {
      if (!finish) break
      current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
    } else if (flow.phase === 'processing') {
      const limit = step.unavailable && flow.attempts[step.id] === 1 ? 1 : step.tools.length
      current = applyFlowEvent(current, flow.toolIndex < limit ? { kind: 'tool', step: step.id, tool: step.tools[flow.toolIndex].name } : { kind: 'settled', step: step.id })
    } else if (flow.phase === 'receipt') {
      if (flow.blocked.includes(step.id) && stopOnFailure) break
      current = applyFlowEvent(current, { kind: flow.blocked.includes(step.id) ? 'retry' : 'next', step: step.id })
    } else break
  }
  return current
}
async function seed(page: import('@playwright/test').Page, current: Case) {
  await page.addInitScript(value => localStorage.setItem('ogarniacz-data-contract-v5', JSON.stringify({ version: 5, selectedCaseId: 1, cases: [value] })), current)
  await page.goto('/')
}

test('completed VAT-Z offers a real example PDF in the receipt and case history after reload', async ({ page }, testInfo) => {
  await seed(page, preparedCase('closing-business', true))
  const taxMessage = page.getByRole('article', { name: 'Wiadomość: Agent urzędu skarbowego' }).filter({ hasText: 'VAT-Z przyjęte' })
  await expect(taxMessage.getByRole('button', { name: /UPO zgłoszenia VAT-Z/ })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await taxMessage.getByRole('button', { name: /UPO zgłoszenia VAT-Z/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('upo-zgloszenia-vat-z')
  const path = await download.path()
  await download.saveAs(testInfo.outputPath('upo-vat-z.pdf'))
  expect((await readFile(path)).subarray(0, 5).toString()).toBe('%PDF-')
  await page.reload()
  await page.getByText('Przebieg sprawy', { exact: true }).click()
  const history = page.locator('.case-artifacts')
  await expect(history.getByRole('button', { name: /Zgłoszenie VAT-Z/ })).toBeVisible()
  await expect(history.getByRole('button', { name: /UPO zgłoszenia VAT-Z/ })).toBeVisible()
})

test('no documents are offered before the first confirmation', async ({ page }) => {
  await seed(page, preparedCase('buying-flat', false))
  await expect(page.locator('.artifact-download')).toHaveCount(0)
})

test('every completed agent step has documents and failed attempts have none', () => {
  for (const scenario of scenarios) {
    const current = preparedCase(scenario.id, true)
    const flow = projectFlow(current)
    expect(flow.phase).toBe('done')
    for (const message of flow.messages.filter(item => item.kind === 'receipt')) {
      const step = flow.steps.find(item => item.id === message.step)
      const artifacts = artifactsForReceipt(message, step)
      if (step?.unavailable && message.attempt === 1) expect(artifacts).toHaveLength(0)
      else expect(artifacts.length, `${scenario.id}: ${step?.id}`).toBeGreaterThan(0)
    }
  }
  const failed = projectFlow(preparedCase('unavailable-agent', true, true))
  expect(failed.blocked).toHaveLength(1)
  const receipt = failed.messages.at(-1)!
  expect(artifactsForReceipt(receipt, failed.steps[failed.index])).toHaveLength(0)
})

for (const [scenarioId, title, filename] of [['childbirth', 'Akt urodzenia', 'akt-urodzenia.pdf'], ['unavailable-agent', 'Potwierdzenie rozliczenia składek', 'skladki-po-ponowieniu.pdf']]) {
  test(`download final result after completion: ${title}`, async ({ page }, testInfo) => {
    const current = preparedCase(scenarioId, true)
    const flow = projectFlow(current)
    const lastReceipt = flow.messages.filter(message => message.kind === 'receipt').at(-1)!
    if (scenarioId === 'unavailable-agent') {
      const artifact = artifactsForReceipt(lastReceipt, flow.steps.at(-1))[0]
      expect(artifact.resultText).toContain('Połączenie odzyskane')
      expect(artifact.resultText).not.toContain('teraz nie odpowiada')
    }
    const birthReceipt = flow.messages.find(message => message.step === 'birth-plan' && message.kind === 'receipt')
    if (birthReceipt) expect(artifactsForReceipt(birthReceipt, flow.steps[0])[1].resultFields.child_pesel).toBe('DEMO-PESEL-DZIECKA')
    await seed(page, current)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: new RegExp(title) }).first().click()
    const download = await downloadPromise
    await download.saveAs(testInfo.outputPath(filename))
  })
}
