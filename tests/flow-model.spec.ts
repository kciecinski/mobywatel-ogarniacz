import { expect, test } from '@playwright/test'
import { scenarios, type Case } from '../src/scenario'
import { applyFlowEvent, buildFlowSteps, initialFlow, projectFlow, transitionFlow, validFlowEvents, type FlowStep } from '../src/flow'

function runTools(current: Case, step: FlowStep, limit = step.tools.length) {
  for (const tool of step.tools.slice(0, limit)) {
    const before = current
    expect(applyFlowEvent(current, { kind: 'settled', step: step.id })).toBe(current)
    current = applyFlowEvent(current, { kind: 'tool', step: step.id, tool: tool.name })
    expect(current).not.toBe(before)
    expect(applyFlowEvent(current, { kind: 'tool', step: step.id, tool: tool.name })).toBe(current)
  }
  return applyFlowEvent(current, { kind: 'settled', step: step.id })
}

for (const scenario of scenarios) for (const answer of scenario.answers) {
  for (const employment of scenario.id === 'closing-business' ? ['does-not-employ', 'employs'] as const : [undefined]) {
    test(`${scenario.title} / ${answer.id} / ${employment ?? 'default'}: tools execute and the entire case closes`, () => {
      let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
      let flow = projectFlow(current)
      expect(flow.messages.every(message => ['Ty', 'Ogarniacz'].includes(message.sender))).toBe(true)
      for (let guard = 0; flow.phase === 'question' && guard < 50; guard++) {
        const question = flow.questions[flow.questionIndex]
        current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.id === 'employment' ? employment! : question.id === 'answer' ? answer.id : question.options[0].value })
        flow = projectFlow(current)
        if (flow.phase === 'question') expect(flow.messages.every(message => ['Ty', 'Ogarniacz'].includes(message.sender))).toBe(true)
      }
      const steps = buildFlowSteps(scenario, answer.id, employment, flow.data, flow.generated, flow.origins)
      expect(flow.steps).toEqual(steps)
      for (let index = 0; index < steps.length; index++) {
        const step = steps[index]
        expect(flow.index).toBe(index)
        expect(flow.phase).toBe('proposal')
        expect(flow.messages.at(-1)?.step).toBe(step.id)
        expect(flow.completed).not.toContain(step.id)
        expect(applyFlowEvent(current, { kind: 'settled', step: step.id })).toBe(current)
        expect(applyFlowEvent(current, { kind: 'next', step: step.id })).toBe(current)
        current = applyFlowEvent(current, { kind: 'confirm', step: step.id })
        flow = projectFlow(current)
        if (step.kind === 'consent') continue
        expect(step.tools.length).toBeGreaterThanOrEqual(3)
        expect(flow.phase).toBe('processing')
        expect(flow.messages.at(-1)?.sender).toBe(step.institution)
        expect(flow.completed).not.toContain(step.id)
        expect(applyFlowEvent(current, { kind: 'confirm', step: step.id })).toBe(current)
        current = runTools(current, step, step.unavailable ? 1 : step.tools.length)
        flow = projectFlow(current)
        if (step.unavailable) {
          expect(flow.phase).toBe('receipt')
          expect(flow.completed).not.toContain(step.id)
          expect(flow.blocked).toContain(step.id)
          expect(applyFlowEvent(current, { kind: 'next', step: step.id })).toBe(current)
          current = applyFlowEvent(current, { kind: 'retry', step: step.id })
          current = runTools(current, step)
          flow = projectFlow(current)
        }
        expect(flow.phase).toBe(index === steps.length - 1 ? 'done' : 'receipt')
        const receipt = flow.messages.filter(message => message.kind === 'receipt' && message.step === step.id).at(-1)!
        expect(receipt.sender).toBe(step.institution)
        expect(receipt.toolCount).toBe(step.tools.length)
        expect(flow.completed).toContain(step.id)
        expect(flow.blocked).not.toContain(step.id)
        if (flow.phase !== 'done') {
          current = applyFlowEvent(current, { kind: 'next', step: step.id })
          flow = projectFlow(current)
        }
      }
      expect(flow.phase).toBe('done')
      expect(flow.blocked).toHaveLength(0)
      expect(flow.completed).toHaveLength(steps.length)
      expect(flow.messages.at(-1)?.sender).toBe('Ogarniacz')
      expect(flow.messages.at(-1)?.step).toBeUndefined()
      expect(flow.messages.at(-1)?.text).toContain('Nie masz już nic do zrobienia')
      expect(flow.messages.at(-1)?.text).not.toMatch(/czekamy|złóż sam|idź do urzędu|musisz jeszcze/i)
      const replayed = projectFlow(JSON.parse(JSON.stringify(current)))
      expect(replayed.messages).toEqual(flow.messages)
      for (const message of replayed.messages) {
        if (message.kind === 'processing' || message.kind === 'receipt' || message.kind === 'offer') {
          expect(message.sender).toBe(replayed.steps.find(step => step.id === message.step)?.institution)
        }
        if (message.sender === 'Ogarniacz') {
          expect(message.step).toBeUndefined()
          expect(message.toolCount).toBeUndefined()
        }
      }
      expect(validFlowEvents(current)).toBe(true)
      if (scenario.id === 'support-benefit') expect(flow.completed).toContain('support-application-plan')
    })
  }
}

test('rejects forged/out-of-order tools and completions', () => {
  const scenario = scenarios[0]
  const before = initialFlow(scenario)
  expect(transitionFlow(before, { kind: 'settled', step: 'ceidg-plan' }, scenario)).toBe(before)
  expect(validFlowEvents({ id: 1, scenarioId: scenario.id, events: [], flow: [{ kind: 'tool', step: 'ceidg-plan', tool: 'ceidg.submit_termination' }] })).toBe(false)
})

test('only sourced, relevant conversational data reaches a step', () => {
  for (const scenario of scenarios) {
    let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
    for (let guard = 0; projectFlow(current).phase === 'question' && guard < 50; guard++) {
      const flow = projectFlow(current)
      const question = flow.questions[flow.questionIndex]
      current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options.at(-1)!.value })
    }
    const flow = projectFlow(current)
    const step = flow.steps[flow.index]
    expect(step.missingData).toEqual([])
    if (step.kind === 'consent') continue
    for (const source of step.dataSources) expect(step.tools[0].input[source.field]).toBe(source.value)
    if (scenario.id === 'childbirth') expect(step.tools[0].input.payout_account).toBeUndefined()
  }
})
