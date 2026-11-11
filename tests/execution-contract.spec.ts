import { expect, test } from '@playwright/test'
import { scenarios } from '../src/scenario'
import { buildFlowSteps } from '../src/flow'

test('document replacement executes through agent tools instead of booking an office visit', () => {
  const scenario = scenarios.find(scenario => scenario.id === 'name-change')!
  const steps = buildFlowSteps(scenario, 'passport-active')
  for (const step of steps) {
    expect(step.offer).not.toMatch(/wizyt|osobiście/i)
    expect(step).toHaveProperty('tools')
    expect(step.receipt).not.toMatch(/złożysz|jeszcze wydany|zabierz/i)
  }
})

test('catalog exposes executable capabilities rather than information bots', async () => {
  const { institutionAgents } = await import('../src/agents')
  for (const agent of institutionAgents) {
    expect(agent.capabilities.length).toBeGreaterThan(0)
    expect(agent.capabilities.join(' ')).not.toMatch(/informacj|wyjaśni/i)
  }
})
