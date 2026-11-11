import { chromium } from '../../node_modules/playwright-core/index.mjs'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({headless:false})
const context = await browser.newContext({viewport:{width:1040,height:760},deviceScaleFactor:1,recordVideo:{dir:'assets/recordings',size:{width:1040,height:760}}})
const page = await context.newPage()
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.goto('https://mobywatel-ogarniacz.pages.dev/')
await page.evaluate(()=>document.fonts.ready)
await page.addStyleTag({content:`#demo-pointer{position:fixed;left:0;top:0;width:30px;height:38px;pointer-events:none;z-index:2147483647;background:#15243b;clip-path:polygon(0 0,0 90%,25% 66%,42% 100%,58% 92%,43% 60%,80% 60%);filter:drop-shadow(1px 2px 2px #ffffff);}`})
await page.evaluate(()=>{const p=document.createElement('div');p.id='demo-pointer';p.style.transform='translate(1000px,700px)';document.body.appendChild(p);document.addEventListener('mousemove',e=>{p.style.transform=`translate(${e.clientX}px,${e.clientY}px)`})})
const start=performance.now(); const events=[]
function mark(name){const time=(performance.now()-start)/1000;events.push({name,time});console.log(name,time.toFixed(2))}
async function hold(ms=900){await page.waitForTimeout(ms)}
async function click(locator){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width*.55,b.y+b.height*.55,{steps:14});await hold(250);await locator.click()}
mark('home');await page.screenshot({path:'assets/screens/home.png'});await hold(1100)
await click(page.getByRole('button',{name:'Rozpocznij: Narodziny dziecka',exact:true}));mark('start-case');await hold(900)
let last=''
for(let i=0;i<300;i++){
 const phase=await page.locator('.flow-conversation').getAttribute('data-phase')
 const text=await page.locator('.flow-active').innerText()
 if(phase==='done'){mark('done');break}
 if(phase==='question'||phase==='proposal'){
  if(text!==last){mark(phase+' '+text.replace(/\s+/g,' ').slice(0,150));last=text;await hold(700)}
  const action=page.locator('.flow-active .message-actions .action-primary').first()
  if(await action.count())await click(action)
  else await click(page.getByRole('button',{name:'Wyślij wiadomość',exact:true}))
  await hold(600)
 } else {await hold(200)}
}
await hold(1400);await page.screenshot({path:'assets/screens/completed.png'})
await click(page.getByText('Przebieg sprawy',{exact:true}));mark('history');await hold(1700)
await page.screenshot({path:'assets/screens/history.png'})
const pdf=page.locator('.case-artifacts .artifact-download').first();const downloaded=page.waitForEvent('download');await click(pdf);await(await downloaded).saveAs('assets/result.pdf');mark('download');await hold(900)
await page.goto('https://mobywatel-ogarniacz.pages.dev/#przeglad');mark('overview');await hold(2000);await page.screenshot({path:'assets/screens/overview.png'})
await click(page.getByRole('button',{name:'Przejdź do sprawy'}));await hold(600)
const agent=page.getByRole('button',{name:/Otwórz agenta:.*stanu cywilnego/}).first()
console.log('Agent buttons',await page.getByRole('button').allTextContents())
if(await agent.count()){await click(agent);mark('thread');await hold(4000);await page.screenshot({path:'assets/screens/thread.png'});await page.keyboard.press('Escape')}
await context.storageState({path:'assets/recordings/session.json'});mark('end');await hold(500)
await context.close();await browser.close();await writeFile('assets/recordings/timing.json',JSON.stringify({events,errors},null,2));if(errors.length)throw Error(errors.join('\n'))
