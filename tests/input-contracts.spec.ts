import { expect, test } from '@playwright/test'
import { scenarios, type Case } from '../src/scenario'
import { applyFlowEvent, projectFlow } from '../src/flow'

for (const scenario of scenarios) for (const answer of scenario.answers) for (const alternative of [false, true]) {
  test(`data audit: ${scenario.title} / ${answer.id} / ${alternative ? 'alternative' : 'default'}`, () => {
    let current: Case = { id: 1, scenarioId: scenario.id, events: [], flow: [] }
    for (let guard = 0; projectFlow(current).phase === 'question' && guard < 50; guard++) {
      const flow = projectFlow(current)
      const q = flow.questions[flow.questionIndex]
      const option = q.id === 'answer' ? q.options.find(option => option.value === answer.id)! : alternative ? q.options.at(-1)! : q.options[0]
      const next = applyFlowEvent(current, { kind: 'answer', question: q.id, value: option.value })
      expect(next, `answer accepted: ${q.id}`).not.toBe(current)
      current = next
    }
    expect(projectFlow(current).phase).toBe('proposal')
    for (let guard = 0; projectFlow(current).phase !== 'done' && guard < 30; guard++) {
      let flow = projectFlow(current)
      const step = flow.steps[flow.index]
      expect(step.missingData, `${step.id}: missing required fields`).toEqual([])
      expect(new Set(step.documents).size).toBe(step.documents.length)
      expect(step.dataSources.every(source => source.source !== 'Brak potwierdzonego źródła')).toBe(true)
      if (step.id === 'car-pcc-plan') {
        const payment = step.tools.find(tool => tool.name === 'payments.execute_mock_transfer')!
        expect(payment.input.from_account).toBe(flow.data.payment_account)
        expect(payment.input.amount_pln).toBe(String(Number(flow.data.vehicle_value) * .02))
      }
      if (step.id === 'identity-plan' || step.id === 'passport-plan') {
        const identity = step.tools.find(tool => tool.name.endsWith('.verify_mock_identity'))!
        expect(identity.input.photo_attachment).toBe(flow.data['file:zdjecie-do-dokumentu.jpg'])
      }
      const firstAttempt = (flow.attempts[step.id] ?? 0) === 0
      current = applyFlowEvent(current, { kind: flow.blocked.includes(step.id) ? 'retry' : 'confirm', step: step.id })
      flow = projectFlow(current)
      if (step.kind === 'consent') continue
      expect(flow.phase).toBe('processing')
      for (const tool of step.tools.slice(0, step.unavailable && firstAttempt ? 1 : step.tools.length)) current = applyFlowEvent(current, { kind: 'tool', step: step.id, tool: tool.name })
      current = applyFlowEvent(current, { kind: 'settled', step: step.id })
      flow = projectFlow(current)
      if (flow.phase === 'receipt' && !flow.blocked.includes(step.id)) current = applyFlowEvent(current, { kind: 'next', step: step.id })
    }
    const result = projectFlow(current)
    expect(result.phase).toBe('done')
    expect(result.blocked).toEqual([])
    expect(result.messages.at(-1)?.text).toContain('Nie masz już nic do zrobienia')
  })
}

function collect(scenarioId: string) {
  let current: Case = { id: 1, scenarioId, events: [], flow: [] }
  for (let guard = 0; projectFlow(current).phase === 'question' && guard < 50; guard++) {
    const flow = projectFlow(current)
    const question = flow.questions[flow.questionIndex]
    current = applyFlowEvent(current, { kind: 'answer', question: question.id, value: question.options[0].value })
  }
  return current
}

test('data without a recorded source cannot authorize an operation', async () => {
  const { buildFlowSteps, transitionFlow } = await import('../src/flow')
  for (const scenario of scenarios) {
    const flow = projectFlow(collect(scenario.id))
    const active = flow.steps[flow.index]
    for (const source of active.dataSources) {
      const origins = { ...flow.origins }
      delete origins[source.field]
      const steps = buildFlowSteps(scenario, flow.answerId!, flow.employeeStatus, flow.data, flow.generated, origins)
      expect(steps[flow.index].missingData).toContain(source.field)
      const missing = { ...flow, steps }
      expect(transitionFlow(missing, { kind: 'confirm', step: active.id }, scenario)).toBe(missing)
    }
  }
})

test('USC outputs are unavailable to ZUS until the registration has actually completed', () => {
  let current = collect('childbirth')
  let flow = projectFlow(current)
  const birth = flow.steps[0]
  expect(flow.steps[1].missingData).toEqual(expect.arrayContaining(['child_pesel', 'birth_record']))
  expect(flow.generated.child_pesel).toBeUndefined()
  current = applyFlowEvent(current, { kind: 'confirm', step: birth.id })
  current = applyFlowEvent(current, { kind: 'tool', step: birth.id, tool: birth.tools[0].name })
  expect(projectFlow(current).generated.child_pesel).toBeUndefined()
  for (const tool of birth.tools.slice(1)) current = applyFlowEvent(current, { kind: 'tool', step: birth.id, tool: tool.name })
  current = applyFlowEvent(current, { kind: 'settled', step: birth.id })
  current = applyFlowEvent(current, { kind: 'next', step: birth.id })
  flow = projectFlow(current)
  expect(flow.steps[1].missingData).toEqual([])
  expect(flow.origins.child_pesel).toEqual({ kind: 'agent', reference: 'birth-plan' })
  expect(flow.steps[1].tools[0].input.child_pesel).toBe(flow.generated.child_pesel)
  expect(flow.steps[0].tools[0].input.payout_account).toBeUndefined()
})

test('independent audit checks cover key inputs for every scenario', () => {
  const essential: Record<string, string[]> = {
    'closing-business': ['company_nip', 'company_regon', 'closing-date', 'cash_register', 'registry_access'],
    childbirth: ['child_name', 'child_birth_date', 'child_sex', 'second_parent_pesel', 'payout_account', 'file:karta-urodzenia.pdf'],
    'buying-flat': ['property_address', 'land_register', 'property_area', 'transaction_date', 'file:akt-notarialny.pdf'],
    'building-house': ['parcel_id', 'investor_right', 'project_id', 'site_manager', 'construction_start', 'file:projekt-budowlany.pdf'],
    bereavement: ['deceased_name', 'deceased_pesel', 'death_date', 'applicant_relation', 'funeral_total', 'applicant_paid', 'payout_account', 'file:karta-zgonu.pdf', 'file:koszty-pogrzebu.pdf'],
    inheritance: ['deceased_pesel', 'heirs', 'inheritance_share', 'land_register', 'property_value', 'payment_account'],
    'name-change': ['surname', 'identity_number', 'passport_number', 'delivery_address', 'identity_photo', 'file:zdjecie-do-dokumentu.jpg'],
    'moving-home': ['old_address', 'new_address', 'move_date', 'occupancy_basis', 'owner_consent'],
    'buying-car': ['vehicle_vin', 'vehicle_value', 'seller_pesel', 'payment_account', 'file:umowa-kupna-auta.pdf', 'file:dowod-rejestracyjny.pdf', 'file:potwierdzenie-oc.pdf'],
    'support-benefit': ['support_pesel', 'representation', 'medical_documentation', 'payout_account'],
    'tax-summons': ['summons_reference', 'summons_deadline', 'office', 'tax_year', 'file:wezwanie.pdf'],
    'unavailable-agent': ['company_nip', 'settlement_period', 'settlement_tax_basis', 'settlement_zus_basis'],
  }
  for (const scenario of scenarios) {
    const flow = projectFlow(collect(scenario.id))
    for (const field of essential[scenario.id]) {
      expect(flow.data[field], `${scenario.id}/${field}`).toBeTruthy()
      expect(flow.origins[field], `${scenario.id}/${field}: known source`).toBeTruthy()
    }
  }
})

test('a bank account invented by an agent or an unsent photo cannot authorize the step', async () => {
  const { buildFlowSteps, transitionFlow } = await import('../src/flow')
  for (const [scenarioId, field] of [['buying-car', 'payment_account'], ['name-change', 'identity_photo']]) {
    const current = collect(scenarioId)
    const flow = projectFlow(current)
    const scenario = scenarios.find(entry => entry.id === scenarioId)!
    const origins = { ...flow.origins, [field]: { kind: 'agent' as const, reference: 'unapproved-profile' } }
    const steps = buildFlowSteps(scenario, flow.answerId!, flow.employeeStatus, flow.data, flow.generated, origins)
    expect(steps[0].missingData).toContain(field)
    const invalid = { ...flow, steps }
    expect(transitionFlow(invalid, { kind: 'confirm', step: steps[0].id }, scenario)).toBe(invalid)
  }
})
