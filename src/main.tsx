import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './ai-native.css'
import './mobywatel.css'
import { motion, useReducedMotion } from 'motion/react'
import { getExample, type AvatarDefinition } from 'open-bot-avatar'
import { mountAvatar } from 'open-bot-avatar/dom'
import { agentForInstitution, institutionAgents } from './agents'
import { closingBusiness, scenarios } from './scenario'
import { emptyWorkspace, loadWorkspace, saveWorkspace } from './storage'
import { goldenPaths, specialDemos, type SpecialDemo } from './showcase'
import { CasesOverview } from './CasesOverview'
import { FlowConversation } from './FlowConversation'
import { applyFlowEvent, projectFlow, type FlowEvent } from './flow'

type AppView = 'home' | 'architecture' | 'catalog' | 'overview'

const viewFragments: Record<AppView, string> = {
  home: 'sprawy',
  overview: 'przeglad',
  catalog: 'agenci',
  architecture: 'jak-to-dziala',
}

function viewFromLocation(): AppView {
  const fragment = window.location.hash.slice(1)
  return (Object.entries(viewFragments).find(([, route]) => route === fragment)?.[0] as AppView | undefined) ?? 'home'
}

function Ogarniacz({ small = false }: { small?: boolean }) {
  const host = useRef<HTMLSpanElement>(null)
  const classic = new URLSearchParams(window.location.search).get('avatars') === 'classic'
  useEffect(() => {
    if (classic || !host.current) return
    const avatar = mountAvatar(host.current, { definition: getExample('lightbulb')!, color: '#a9c39c', reducedMotion: 'system', label: '' })
    return () => avatar.destroy()
  }, [classic])
  if (classic) return small ? <span className="mini-og" aria-hidden="true"><i /><i /></span> : <ClassicOgarniacz />
  return <span ref={host} className={small ? 'og-bulb og-bulb-small' : 'og-bulb og-bulb-large'} aria-hidden="true" />
}

function ClassicOgarniacz() {
  const reduced = useReducedMotion()
  return <motion.div className="mascot" aria-hidden="true" animate={reduced ? {} : { y: [0, -3, 0], rotate: [0, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><div className="mascot-antenna"><span /></div><div className="mascot-body"><div className="mascot-face"><span className="mascot-eye" /><span className="mascot-eye" /><span className="mascot-mouth" /></div><span className="mascot-mark" /></div></motion.div>
}

// Soft civic silhouettes, drawn for this experiment in the Open Bot Avatar format.
const civicShapes: Record<string, string> = {
  zus: 'M12 38 Q12 27 22 24 L42 14 Q50 10 58 14 L78 24 Q88 27 88 38 L88 71 Q88 87 73 89 Q50 92 27 89 Q12 87 12 71 Z',
  tax: 'M16 32 Q16 22 26 22 L34 22 L34 16 Q34 12 39 12 L61 12 Q66 12 66 16 L66 22 L74 22 Q84 22 84 32 L88 70 Q89 86 74 89 Q50 92 26 89 Q11 86 12 70 Z',
  civil: 'M11 43 Q11 28 25 24 Q37 19 50 20 Q63 19 75 24 Q89 28 89 43 L86 71 Q85 87 72 89 Q50 92 28 89 Q15 87 14 71 Z',
  register: 'M11 40 Q11 30 20 27 L27 25 L27 20 Q27 16 32 16 L68 16 Q73 16 73 20 L73 25 L80 27 Q89 30 89 40 L89 72 Q89 86 75 89 Q50 92 25 89 Q11 86 11 72 Z',
  municipality: 'M12 42 Q12 31 21 28 L43 14 Q50 9 57 14 L79 28 Q88 31 88 42 L85 73 Q84 86 72 89 Q50 92 28 89 Q16 86 15 73 Z',
  county: 'M13 35 Q13 25 24 23 L30 23 L30 18 Q30 13 35 13 L45 13 L45 23 L55 23 L55 13 L65 13 Q70 13 70 18 L70 23 L76 23 Q87 25 87 35 L87 72 Q87 86 74 89 Q50 92 26 89 Q13 86 13 72 Z',
  court: 'M13 39 Q13 30 22 27 L46 13 Q50 10 54 13 L78 27 Q87 30 87 39 L87 73 Q87 85 74 88 Q50 92 26 88 Q13 85 13 73 Z',
  notary: 'M15 31 Q15 22 24 22 L31 22 Q33 13 42 13 L58 13 Q67 13 69 22 L76 22 Q85 22 85 31 L89 70 Q90 86 75 89 Q50 92 25 89 Q10 86 11 70 Z',
  inspector: 'M12 40 Q12 30 21 27 L31 24 L31 18 Q31 14 36 14 L64 14 Q69 14 69 18 L69 24 L79 27 Q88 30 88 40 L86 72 Q85 86 73 89 Q50 92 27 89 Q15 86 14 72 Z',
  wzon: 'M13 43 Q13 28 27 24 Q38 20 50 20 Q62 20 73 24 Q87 28 87 43 L87 69 Q87 84 74 88 Q50 93 26 88 Q13 84 13 69 Z',
  ministry: 'M10 39 Q10 29 20 26 L27 24 L27 19 Q27 14 32 14 L68 14 Q73 14 73 19 L73 24 L80 26 Q90 29 90 39 L88 72 Q87 86 74 89 Q50 92 26 89 Q13 86 12 72 Z',
}
function civicAvatar(portrait: string): AvatarDefinition {
  return { version: 1, id: `civic-${portrait}`, name: 'Agent', body: { path: civicShapes[portrait] ?? civicShapes.zus }, eyes: { x: 50, y: 52, spacing: 17, scale: 1 } }
}

function ExperimentalPortrait({ portrait }: { portrait: string }) {
  const host = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!host.current) return
    const definition = civicAvatar(portrait)
    const color = getComputedStyle(host.current).getPropertyValue('--portrait-color').trim()
    const avatar = mountAvatar(host.current, { definition, color, reducedMotion: 'system', label: '' })
    return () => avatar.destroy()
  }, [portrait])
  return <span className={`institution-portrait portrait-${portrait} experimental-portrait`} aria-hidden="true"><span ref={host} className="experimental-avatar" /></span>
}

function InstitutionPortrait({ institution }: { institution: string }) {
  const reduced = useReducedMotion()
  const portrait = agentForInstitution(institution)?.portrait ?? 'register'
  if (new URLSearchParams(window.location.search).get('avatars') !== 'classic') return <ExperimentalPortrait portrait={portrait} />
  return (
    <motion.span className={`institution-portrait portrait-${portrait}`} aria-hidden="true" animate={reduced ? {} : { y: [0, -1.5, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}>
      <span className="portrait-top" />
      <span className="portrait-face"><i /><i /></span>
      <span className="portrait-detail" />
    </motion.span>
  )
}

function chatName(institution: string) {
  if (institution.includes('Rozwoju i Technologii')) return 'Agent CEIDG'
  if (institution === 'ZUS') return 'Agent ZUS'
  if (institution === 'Urząd skarbowy') return 'Agent urzędu skarbowego'
  return `Agent: ${institution}`
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [topicQuery, setTopicQuery] = useState('')
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const [view, setView] = useState<AppView>(viewFromLocation)
  const [confirmReset, setConfirmReset] = useState(false)
  const viewTitle = useRef<HTMLHeadingElement>(null)
  const casesTitle = useRef<HTMLHeadingElement>(null)
  const resetButton = useRef<HTMLButtonElement>(null)
  const confirmResetButton = useRef<HTMLButtonElement>(null)
  const handleFlowEvent = useCallback((caseId: number, flowEvent: FlowEvent) => {
    setWorkspace(previous => ({ ...previous, cases: previous.cases.map(entry => entry.id === caseId ? applyFlowEvent(entry, flowEvent) : entry) }))
  }, [])
  const { cases, selectedCaseId } = workspace
  const currentCase = cases.find((item) => item.id === selectedCaseId)
  const scenario = scenarios.find((item) => item.id === currentCase?.scenarioId) ?? closingBusiness
  const currentFlow = currentCase ? projectFlow(currentCase) : undefined
  const event = currentCase?.events[0]
  useEffect(() => { saveWorkspace(workspace) }, [workspace])

  useEffect(() => {
    const syncViewFromLocation = () => setView(viewFromLocation())
    window.addEventListener('hashchange', syncViewFromLocation)
    window.addEventListener('popstate', syncViewFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncViewFromLocation)
      window.removeEventListener('popstate', syncViewFromLocation)
    }
  }, [])

  useEffect(() => {
    if (confirmReset) confirmResetButton.current?.focus()
  }, [confirmReset])


  useEffect(() => {
    if (view !== 'home') viewTitle.current?.focus()
  }, [view])

  function startCase(scenarioId: string, demo?: SpecialDemo, fullRoute = false) {
    setWorkspace((previous) => {
      if (previous.selectedCaseId !== null) return previous
      const id = Math.max(0, ...previous.cases.map((item) => item.id)) + 1
      return {
        cases: [...previous.cases, { id, scenarioId, ...(fullRoute ? { fullRoute: true } : {}), ...(demo ? { demo } : {}), events: [], flow: [], history: [{ kind: 'started' }] }],
        selectedCaseId: id,
      }
    })
  }

  function resetCases() {
    setConfirmReset(false)
    saveWorkspace(emptyWorkspace())
    setWorkspace(emptyWorkspace())
    casesTitle.current?.focus()
  }

  function selectCase(id: number | null) {
    setWorkspace((previous) => ({ ...previous, selectedCaseId: id }))
  }

  function navigateToView(nextView: AppView) {
    const fragment = '#' + viewFragments[nextView]
    if (window.location.hash !== fragment) window.history.pushState(null, '', fragment)
    setView(nextView)
    setSidebarOpen(false)
  }

  return (
    <div className={`app-shell${sidebarOpen ? ' sidebar-open' : ''}`} onKeyDown={event => { if (event.key === 'Escape') setSidebarOpen(false) }}>
      <div className="chat-topbar"><button type="button" className="sidebar-toggle" aria-label={sidebarOpen ? 'Schowaj menu i sprawy' : 'Pokaż menu i sprawy'} aria-expanded={sidebarOpen} aria-controls="chat-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M9 4v16" stroke="currentColor" strokeWidth="1.5"/></svg></button><span className="product-brand" aria-label="mObywatel — Ogarniacz"><strong>mObywatel</strong><small>Ogarniacz</small></span><button type="button" className="quick-new-chat" onClick={() => { selectCase(null); navigateToView('home'); setSidebarOpen(false) }}>Nowa sprawa do załatwienia <span aria-hidden="true">＋</span></button></div>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Zamknij menu" onClick={() => setSidebarOpen(false)} />}
      <header id="chat-sidebar" className="topbar" inert={!sidebarOpen}>
        <a className="brand" href="#sprawy" aria-label="mObywatel — Ogarniacz — strona główna">
          <span className="brand-symbol" aria-hidden="true"><span /></span>
          <span className="product-brand"><strong>mObywatel</strong><small>Ogarniacz</small></span>
        </a>
        <nav className="app-nav" aria-label="Nawigacja główna">
          <button type="button" aria-current={view === 'home' ? 'page' : undefined} onClick={() => navigateToView('home')}>Sprawy</button>
          <button type="button" aria-current={view === 'overview' ? 'page' : undefined} onClick={() => navigateToView('overview')}>Twoje sprawy</button>
          <button type="button" aria-current={view === 'catalog' ? 'page' : undefined} onClick={() => navigateToView('catalog')}>Agenci</button>
          <button type="button" aria-current={view === 'architecture' ? 'page' : undefined} onClick={() => navigateToView('architecture')}>Jak to działa</button>
        </nav>
        <button className="new-chat" type="button" onClick={() => { selectCase(null); navigateToView('home') }}>＋ Nowa sprawa do załatwienia</button>
          <aside className="cases" aria-labelledby="cases-title">
            <div className="cases-heading">
              <h2 id="cases-title">Twoje sprawy</h2>
              <span className="case-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 6.5h6l1.6 2H20v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              </span>
            </div>
            {cases.length > 0 && (
              <div className="case-list">
                {cases.map((item) => {
                  const itemScenario = scenarios.find((entry) => entry.id === item.scenarioId)
                  return <div className="case-list-item" key={item.id}>
                    <button type="button" aria-label={`Sprawa ${item.id} — ${item.demo ? specialDemos[item.demo].title : itemScenario?.title ?? 'Nieznana sprawa'}`} aria-current={item.id === selectedCaseId ? 'true' : undefined} onClick={() => { selectCase(item.id); setSidebarOpen(false) }}>
                      Sprawa {item.id} — {item.demo ? specialDemos[item.demo].title : itemScenario?.title ?? 'Nieznana sprawa'}
                    </button>
                  </div>
                })}
                <button type="button" onClick={() => selectCase(null)}>Nowa sprawa</button>
                {!confirmReset ? <button ref={resetButton} type="button" onClick={() => setConfirmReset(true)}>Resetuj wszystkie sprawy</button> : <div role="group" aria-label="Potwierdzenie resetu spraw">
                  <p>Usunąć wszystkie rozpoczęte sprawy i ich historię?</p>
                  <button ref={confirmResetButton} type="button" onClick={resetCases}>Potwierdź reset spraw</button>
                  <button type="button" onClick={() => { setConfirmReset(false); requestAnimationFrame(() => resetButton.current?.focus()) }}>Anuluj reset</button>
                </div>}
              </div>
            )}
          </aside>
      </header>

      <main id="start" className={`workspace${currentCase ? ' has-current-case' : ''}`}>
        {view === 'home' && !currentCase && <section className="welcome" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <h1 id="welcome-title">Cześć, jestem Ogarniacz.</h1>
            <p className="intro">Powiedz, co chcesz ogarnąć. Resztę poukładamy razem.</p>
          </div>
          <div className="mascot-stage"><Ogarniacz /></div>
        </section>}

        {view === 'home' && currentCase && <FlowConversation key={currentCase.id} current={currentCase} onEvent={handleFlowEvent} renderPortrait={institution => <InstitutionPortrait institution={institution} />} agentName={chatName} onNew={() => { selectCase(null); navigateToView('home') }} renderCoordinator={() => <Ogarniacz small />} />}
        {view === 'home' && <div className="content-grid">
          {!currentCase && <section className="goals" aria-labelledby="goals-title">
            <h2 id="goals-title" className="visually-hidden">Co chcesz ogarnąć?</h2>
            <form className="topic-composer" onSubmit={(event) => { event.preventDefault(); const matches = scenarios.filter(entry => entry.title.toLocaleLowerCase('pl').includes(topicQuery.toLocaleLowerCase('pl'))); if (topicQuery.trim() && matches.length === 1) startCase(matches[0].id) }}>
              <label className="visually-hidden" htmlFor="topic-query">Jaką sprawą się zajmiemy?</label>
              <input id="topic-query" value={topicQuery} onChange={event => setTopicQuery(event.target.value)} placeholder="Wyszukaj sprawę, np. narodziny dziecka…" autoComplete="off" />
              <div className="composer-footer"><button type="submit" aria-label="Rozpocznij pasującą sprawę" disabled={!topicQuery.trim() || scenarios.filter(entry => entry.title.toLocaleLowerCase('pl').includes(topicQuery.toLocaleLowerCase('pl'))).length !== 1}>↑</button></div>
            </form>
            {!topicQuery && !showAllTopics && <p className="showcase-label">Na początek</p>}
            <div className={`topic-suggestions${!showAllTopics && !topicQuery ? ' featured-paths' : ''}`} aria-live="polite">
              {[...scenarios].sort((a, b) => (goldenPaths[a.id]?.order ?? '99').localeCompare(goldenPaths[b.id]?.order ?? '99')).filter(entry => !topicQuery || entry.title.toLocaleLowerCase('pl').includes(topicQuery.toLocaleLowerCase('pl'))).slice(0, showAllTopics || topicQuery ? scenarios.length : 3).map(entry => <button key={entry.id} type="button" aria-label={`Rozpocznij: ${entry.title}`} onClick={() => startCase(entry.id, undefined, Boolean(goldenPaths[entry.id]))}><span>{entry.title}{goldenPaths[entry.id] && <small className="golden-caption">{goldenPaths[entry.id].description}</small>}</span><span aria-hidden="true">{goldenPaths[entry.id]?.order ?? '↗'}</span></button>)}
              {topicQuery && !scenarios.some(entry => entry.title.toLocaleLowerCase('pl').includes(topicQuery.toLocaleLowerCase('pl'))) && <p>Nie mam jeszcze takiej sprawy. Spróbuj innej nazwy lub wybierz jeden z tematów.</p>}
            </div>
            {!topicQuery && <button className="more-topics" type="button" aria-expanded={showAllTopics} onClick={() => setShowAllTopics(!showAllTopics)}>{showAllTopics ? 'Pokaż mniej' : `Wszystkie tematy (${scenarios.length})`}</button>}
            {!topicQuery && <details className="special-demos"><summary>Sprawdź też inne sytuacje</summary>{Object.entries(specialDemos).map(([id, demo]) => <button type="button" key={id} onClick={() => startCase(demo.scenarioId, id as SpecialDemo)}><strong>{demo.title}</strong><span>{demo.description}</span></button>)}</details>}
          </section>}

        </div>}
        {view === 'architecture' && <section className="scenario-card information-view" aria-labelledby="architecture-title">
          <div className="section-heading"><h2 id="architecture-title" ref={viewTitle} tabIndex={-1}>Jak działa współpraca agentów?</h2><p>Prywatny asystent koordynuje zadanie, a każda instytucja odpowiada za własny zakres.</p></div>
          <p>Obywatel wybiera cel i zatwierdza przekazanie potrzebnych danych. Ogarniacz dobiera agentów instytucji, pilnuje zależności, wykonuje potwierdzone kroki i doprowadza sprawę do końca. Każdy agent działa w granicach możliwości swojej instytucji.</p>
          <p>Rejestr możliwości pomaga znaleźć właściwego agenta. Narzędzia i lokalne integracje pozostają po stronie danej instytucji; nie są osobnymi agentami. W tym demo współpraca korzysta z przygotowanych danych, bez prawdziwych połączeń z urzędami.</p>
          <div className="architecture-tree" aria-label="Ogólna architektura federacji">
            <div className="architecture-node architecture-citizen"><strong>Obywatel</strong><span>wybiera cel i zakres zgody</span></div>
            <div className="architecture-link" aria-hidden="true">↓</div>
            <div className="architecture-node architecture-coordinator"><Ogarniacz small /><strong>Ogarniacz — prywatny koordynator</strong><span>koordynuje wykonanie, zgody i potwierdzenia</span></div>
            <div className="architecture-branches">
              <div className="architecture-node"><strong>Rejestr możliwości</strong><span>pomaga dobrać właściwego agenta</span></div>
              <div className="architecture-node"><strong>Agenci instytucji</strong><span>odpowiadają za zakres swojej instytucji</span></div>
            </div>
            <div className="architecture-link" aria-hidden="true">↓</div>
            <div className="architecture-branches">
              {institutionAgents.slice(0, 4).map((agent) => <div className="architecture-node" key={agent.id}><InstitutionPortrait institution={agent.institution} /><strong>{agent.institution}</strong><span>{agent.capabilities[0]}</span></div>)}
            </div>
            <div className="architecture-link" aria-hidden="true">↓</div>
            <div className="architecture-node architecture-tools"><strong>Lokalne narzędzia i integracje instytucji</strong><span>pozostają pod odpowiedzialnością danej instytucji</span></div>
          </div>
          <section className="case-architecture" aria-labelledby="case-map-title">
            <h3 id="case-map-title">Mapa współpracy z wybranej sprawy</h3>
            {currentCase && event ? <>
              <p>Sprawa {currentCase.id}: {scenario.title}. Pokazuję tylko kroki, które dotarły już do sprawy.</p>
              <ol className="architecture-flow">
                {currentFlow?.steps.filter(step => currentFlow.messages.some(message => message.step === step.id)).map((step, index) => <li key={step.id}>
                  <span className="architecture-flow-number">{index + 1}</span><div><strong>{step.institution}</strong><p>{step.title}</p><p>{currentFlow.completed.includes(step.id) ? 'Potwierdzone w sprawie' : currentFlow.blocked.includes(step.id) ? 'Czeka na odpowiedź agenta' : ['processing', 'waiting'].includes(currentFlow.phase) ? 'Agent prowadzi sprawę' : 'Czeka na Twój krok'}</p></div>
                </li>)}
              </ol>
              <button type="button" className="activity-button" onClick={() => navigateToView('home')}>Wróć do sprawy</button>
            </> : <p>Rozpocznij sprawę i wybierz odpowiedź, aby zobaczyć mapę jej uczestników oraz zależności.</p>}
          </section>
        </section>}
        {view === 'catalog' && <section className="scenario-card information-view" aria-labelledby="catalog-title">
          <div className="section-heading"><h2 id="catalog-title" ref={viewTitle} tabIndex={-1}>Katalog agentów</h2></div>
          <div className="agent-catalog">
            {institutionAgents.map(agent => <article className="agent-catalog-card" key={agent.id}>
              <div className="message-heading"><InstitutionPortrait institution={agent.institution} /><h3>{agent.institution}</h3></div>
              <ul>{agent.capabilities.map(capability => <li key={capability}>{capability}</li>)}</ul>
            </article>)}
          </div>
        </section>}
        {view === 'overview' && <CasesOverview cases={cases} titleRef={viewTitle} onOpen={id => { selectCase(id); navigateToView('home') }} onNew={() => { selectCase(null); navigateToView('home') }} />}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
