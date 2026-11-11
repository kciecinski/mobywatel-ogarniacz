import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
const preview = process.env.RELEASE_AUDIT_URL ?? 'http://127.0.0.1:4184/'
test.skip(!process.env.RELEASE_AUDIT_URL, 'Set RELEASE_AUDIT_URL to explicitly audit a deployed build.')

for (const [title, width] of [['Zamknięcie firmy', 390], ['Narodziny dziecka', 320], ['Budowa domu', 1440]] as const) {
  test(`production anonymous full showcase: ${title} / ${width}px`, async ({ page }) => {
    test.setTimeout(120000)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (response.url().startsWith(preview) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    await page.setViewportSize({ width, height: 900 })
    await page.goto(preview)
    await expect(page).toHaveTitle('mObywatel — Ogarniacz')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const started = Date.now()
    let actions = 0
    await page.getByRole('button', { name: `Rozpocznij: ${title}`, exact: true }).click()
    for (let guard = 0; guard < 50; guard++) {
      const phase = await page.locator('.flow-conversation').getAttribute('data-phase')
      if (phase === 'done') break
      if (phase === 'question') {
        const action = page.locator('.flow-active .message-actions .action-primary')
        if (await action.count()) await action.first().click()
        else await page.getByRole('button', { name: 'Wyślij wiadomość', exact: true }).click()
        actions++
      } else if (phase === 'proposal') {
        await page.locator('.flow-active .message-actions .action-primary').first().click()
        actions++
      } else if (phase === 'processing' || phase === 'waiting') {
        await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', /receipt|done/, { timeout: 30000 })
      } else if (phase === 'receipt') await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', /proposal|done/)
      else throw new Error(`Unexpected phase ${phase}`)
    }
    await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
    await expect(page.locator('.flow-active')).toContainText('Nie masz już nic do zrobienia')
    const elapsedMs = Date.now() - started
    await page.reload()
    await expect(page.locator('.flow-conversation')).toHaveAttribute('data-phase', 'done')
    await page.getByText('Przebieg sprawy', { exact: true }).click()
    expect(await page.locator('.case-artifacts .artifact-download').count()).toBeGreaterThan(0)
    const downloadPromise = page.waitForEvent('download')
    await page.locator('.case-artifacts .artifact-download').first().click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    const downloadedPath = await download.path()
    expect(downloadedPath).not.toBeNull()
    const pdf = await readFile(downloadedPath!)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
    await download.saveAs(`/private/tmp/ogarniacz-release-${width}.pdf`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `shots/release-${width}-final.png` })
    await page.goto(`${preview}#przeglad`)
    await expect(page.locator('.case-status')).toHaveText('Załatwiona')
    await expect(page.getByRole('button', { name: 'Przejdź do sprawy' })).toBeVisible()
    await page.goto(`${preview}#agenci`)
    await expect(page.locator('.agent-catalog-card').first()).toBeVisible()
    await page.goto(`${preview}#jak-to-dziala`)
    await expect(page.getByRole('heading', { name: 'Jak działa współpraca agentów?' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
    await writeFile(`/private/tmp/ogarniacz-showcase-${width}.json`, JSON.stringify({ title, width, elapsedMs, actions, errors }, null, 2))
  })
}
