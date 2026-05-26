
// ─── USE CASES ───
const UC_DATA = [
  {cat:'Professional',items:[
    {title:'Difficult email reply',save:'20–30 min',freq:'Daily',persona:'Managers & Founders',before:'So uh... I need to tell Sarah the Q3 launch is pushed two weeks, it\'s not really our fault but I don\'t want to sound defensive, and I should say when we\'ll give an update...',after:'Hi Sarah, quick heads-up — a pipeline dependency is pushing Q3 delivery by ~2 weeks to July 28th. Mitigation plan already in motion. Full update EOD Thursday. Happy to jump on a call.',context:'<strong>The blank page problem.</strong> You know what you want to say but getting it into a careful email takes 20 minutes you don\'t have.',tag:'Email'},
    {title:'Post-meeting follow-up',save:'15–20 min',freq:'After every meeting',persona:'Knowledge Workers',before:'Good meeting with Priya, she agreed to the Q3 scope, needs design mockups by Friday, I own the API spec, follow up in two weeks...',after:'Hi Priya, great to connect. Confirmed: Q3 scope agreed, design mockups from your side by Friday, API spec from me by Monday. I\'ll follow up in two weeks to sync on progress.',context:'<strong>Capture while it\'s fresh.</strong> Walk out of the meeting room, speak for 60 seconds. The follow-up is ready before you sit back down.',tag:'Email'},
    {title:'Weekly status report',save:'20–25 min',freq:'Every Friday',persona:'Managers & ICs',before:'So this week I finished the auth module, got unblocked on the DB issue after talking to Rahul, starting API docs Monday, still waiting on the Figma link from design...',after:'Week 12 Update ✅ Auth module complete ✅ DB blocker resolved (Rahul) 🔄 API docs starting Monday ⚠️ Blocker: Figma link pending from Design',context:'<strong>The report nobody wants to write.</strong> Speak the week on your commute home. Formatted and sent before you leave the office.',tag:'Report'},
    {title:'Meeting notes & minutes',save:'15–20 min',freq:'After every meeting',persona:'All professionals',before:'We decided to use Supabase over PlanetScale, Harshal owns the migration by EOD Friday, there was a question about connection pooling that needs follow-up...',after:'Decision: Supabase selected over PlanetScale. Owner: Harshal — migration by EOD Friday. Open: Connection pooling investigation — Harshal to report back.',context:'<strong>Minutes that actually get written.</strong> Speak for 2 minutes immediately after the meeting. Decisions, actions, open questions — structured automatically.',tag:'Minutes'},
    {title:'Escalation or bad news',save:'30–40 min',freq:'When needed',persona:'Managers & Founders',before:'So the production deploy caused downtime... the root cause was a missing env variable... customers were affected for 25 minutes... we rolled back at 2:40...',after:'At 14:00 the deploy triggered a 25-min outage. Root cause: missing prod env variable. Rolled back 14:40. Impact: ~200 users. Immediate: env audit complete. Long-term: pre-deploy checklist implemented.',context:'<strong>The hardest email to write.</strong> Speak the facts. Vokal handles the diplomatic framing — accountable, specific, calm.',tag:'Email'},
  ]},
  {cat:'Sales',items:[
    {title:'Post-call follow-up',save:'15–20 min',freq:'After every call',persona:'Sales Reps',before:'Good call with Neha, she\'s dealing with onboarding drop-off, budget around 20K, she mentioned Intercom, main concern is integration timeline, demo with CTO on Tuesday...',after:'Hi Neha, great speaking today. Your onboarding drop-off challenge is exactly what we address. Looking forward to Tuesday\'s demo with your CTO — I\'ll send a tailored agenda beforehand.',context:'<strong>Strike while the call is warm.</strong> Sit in the car for 2 minutes and speak. The follow-up lands while the conversation is still top of mind.',tag:'Email'},
    {title:'CRM note entry',save:'5–10 min per call',freq:'After every interaction',persona:'Sales & CS Teams',before:'Neha Kumar, Series A, 15-person team, onboarding drop-off 40%, budget around 20K, using Intercom, integration concern, next step CTO demo Tuesday...',after:'Contact: Neha Kumar | Series A | 15 ppl. Pain: Onboarding drop-off (~40%). Budget: ~₹20K/mo. Current: Intercom. Key concern: Integration timeline. Next: CTO demo Tuesday — send agenda.',context:'<strong>8 calls per day = 80 minutes of CRM admin.</strong> Speak the note immediately after the call. Structured, complete, filed.',tag:'CRM Note'},
    {title:'Proposal follow-up',save:'10–15 min',freq:'Every 3–4 days',persona:'Sales Reps',before:'I just want to check in on the proposal, see if they have questions, I don\'t want to be too pushy but I need to know if we\'re moving forward...',after:'Hi Marcus, just checking in on last week\'s proposal. Happy to adjust scope or clarify anything. Available for a quick call this week if that helps. What\'s your current thinking?',context:'<strong>The follow-up you\'ve been putting off.</strong> Warm but not desperate. Professional but human. Sent before you second-guess yourself.',tag:'Email'},
    {title:'Objection response',save:'15–20 min',freq:'As needed',persona:'Sales & Founders',before:'They said the pricing is too high, I know our ROI is 10x so I want to explain that without sounding defensive, and maybe offer a pilot...',after:'Thanks for being direct on pricing. Our average customer sees 10× ROI by month 3 — I\'d love to walk you through that briefly. Would a 30-day pilot at reduced scope help de-risk the decision?',context:'<strong>Never lose a deal to a poorly written objection response.</strong> Speak the argument. Vokal structures it persuasively.',tag:'Email'},
  ]},
  {cat:'Content',items:[
    {title:'LinkedIn insight post',save:'30–45 min',freq:'Weekly',persona:'Founders & Executives',before:'I realised today that most teams don\'t have a writing problem, they actually have a thinking problem. The emails are bad because the thinking wasn\'t clear...',after:'"Most teams don\'t have a writing problem.\nThey have a thinking problem.\n\nBad emails exist because the thinking wasn\'t clear — not because the writing was poor.\n\nFix the thinking. The writing fixes itself."',context:'<strong>The post that never gets written.</strong> You had the thought on a walk. Vokal captures it with a hook before the energy disappears.',tag:'LinkedIn'},
    {title:'Building in public update',save:'30–50 min',freq:'Weekly',persona:'Founders',before:'This week we launched on Product Hunt, got 847 waitlist signups, the pipeline is live, it\'s been a crazy week but really exciting...',after:'Week 3 building Vokal → 847 waitlist signups (target was 200) → Product Hunt live → Pipeline complete. Biggest learning: the explanation layer IS the product. Not the output.',context:'<strong>Authentic without being unstructured.</strong> Speak naturally about the week. Vokal preserves the rawness while tightening the arc.',tag:'LinkedIn'},
    {title:'Newsletter draft',save:'1–2 hours',freq:'Weekly',persona:'Creators & Consultants',before:'This week\'s newsletter is about the gap between thinking and writing, why professionals struggle, the 88 minutes stat, ending with a framework...',after:'The 88-minute problem: The average professional spends 88 minutes a day on writing they hate. Not because they\'re bad writers — because writing requires translating thought into structure. Here\'s a 3-step framework...',context:'<strong>The blank page is gone.</strong> Speak the content across the week as ideas arrive. Vokal assembles the draft.',tag:'Newsletter'},
    {title:'Product launch copy',save:'2–3 hours',freq:'Per launch',persona:'Founders & PMs',before:'We\'re launching Vokal — voice notes into polished professional writing in your exact voice, AI explains every change, email Slack LinkedIn reports...',after:'For email: Speak 60 seconds → polished email in your voice, explained. For LinkedIn: Same note → post with a converting hook. For reports: Ramble 2 minutes → structured executive report.',context:'<strong>One voice note, four channels.</strong> Speak the launch story once. Vokal reformats it for email, LinkedIn, Twitter, and Product Hunt.',tag:'Multi-format'},
  ]},
  {cat:'Developers',items:[
    {title:'PR description',save:'10–15 min',freq:'Per PR',persona:'Developers',before:'This PR adds rate limiting to the voice processing endpoint, uses Upstash Redis, 100 requests per user per hour, falls back gracefully if Redis is down...',after:'What: Rate limiting on /voice/process endpoint. How: Upstash Redis counter, 100 req/user/hour. Fallback: Graceful degradation if Redis unavailable. Testing: Load tested at 150 req/min, p95 < 200ms.',context:'<strong>PRs that actually explain themselves.</strong> Speak while the context is fresh — before you context-switch to the next task.',tag:'Documentation'},
    {title:'Architecture decision record',save:'30–45 min',freq:'Per major decision',persona:'Senior Developers',before:'We decided Pinecone over pgvector because we need namespace isolation per user, managed scaling is worth the cost, trade-off is vendor lock-in and higher latency...',after:'ADR-007: Pinecone over pgvector. Context: User-level namespace isolation required. Rationale: Managed scaling, native namespacing. Trade-offs: Vendor lock-in, +40ms vs local. Alternatives: pgvector, Weaviate.',context:'<strong>The ADR that actually gets written.</strong> Speak for 3 minutes after the decision. Vokal formats it before you forget the rationale.',tag:'ADR'},
    {title:'Technical explanation to stakeholders',save:'20–30 min',freq:'Weekly',persona:'Lead Developers',before:'The pipeline is slow because we make 6 sequential LLM calls and each waits for the previous, we need to parallelise the ones that don\'t depend on each other...',after:'The pipeline runs 6 AI steps sequentially — like 6 people working one at a time. Steps 3 and 4 are independent and can run in parallel, cutting total time by ~35%. Small architectural change, significant impact.',context:'<strong>Technical truth, accessible language.</strong> Speak at full depth. Vokal reformats for a non-technical audience without losing accuracy.',tag:'Internal Comms'},
    {title:'Bug report',save:'10 min',freq:'Per bug',persona:'All Developers',before:'When you upload an audio file over 10MB the spinner appears but nothing happens, there\'s a 413 error in the console, it should show an error message...',after:'Bug: Audio upload fails silently for files >10MB. Steps: Upload audio >10MB via Studio. Expected: Upload or clear error. Actual: Loading spinner, no feedback, 413 in console. Priority: High — core user flow.',context:'<strong>Complete bug reports, every time.</strong> Speak through the steps while the context is fresh. No more minimal reports that need 3 follow-up questions.',tag:'Bug Report'},
  ]},
  {cat:'Personal',items:[
    {title:'Daily journal',save:'15 min friction removed',freq:'Daily ritual',persona:'Thinkers & Reflectors',before:'Good day overall, the morning was rough — anxious about the investor meeting but it went well. I talked too much and listened too little in the call. I want to work on that...',after:'May 25 — Evening. Mixed day. Anxiety before the investor call resolved well. Key observation: I dominated the conversation. Need to build pause habits. One question I\'d ask differently next time: "What\'s your biggest concern?" — earlier.',context:'<strong>The journal you\'ll actually keep.</strong> 2 minutes while making tea. No blank page, no pressure. The habit forms because the friction is gone.',tag:'Journal'},
    {title:'Brain dump to task list',save:'15 min + ideas not lost',freq:'End of week',persona:'Knowledge Workers',before:'Next week I need to finish the API spec, follow up with Rajan about the design review, prepare for Thursday\'s presentation, sort the AWS billing issue...',after:'Next Week: ☐ API spec — Monday ☐ Follow up: Rajan → design review date ☐ Thursday presentation prep (Wed/Thu) ☐ AWS billing alert — investigate ☐ Investor email — priority reply',context:'<strong>Nothing gets lost.</strong> The Friday brain dump takes 2 minutes. Everything floating in your head is structured and ready for Monday.',tag:'Tasks'},
    {title:'Idea capture',save:'Ideas not lost',freq:'Whenever',persona:'Everyone',before:'Actually the reason Vokal is different is not the transcription but the coaching layer — that\'s also why people will pay long term. I should write this down...',after:'Idea — Vokal moat: The moat isn\'t transcription or generation. It\'s the coaching layer. People pay long-term because they\'re getting better, not just getting output. Competitors can copy the pipeline. They can\'t copy the accumulated voice profile.',context:'<strong>Captured in the moment, structured in seconds.</strong> The insight that arrived on a walk is now a formatted note in your Notion.',tag:'Idea'},
    {title:'Difficult personal message',save:'Emotional clarity',freq:'When needed',persona:'Everyone',before:'I need to tell my co-founder I feel decisions are being made without me lately and it\'s making me anxious, but I don\'t want to sound accusatory or dramatic...',after:'Hey — I wanted to raise something I\'ve been sitting with. I\'ve noticed a few decisions made without my input recently, and I\'d like us to realign on how we make calls together. Not a big deal — just worth a conversation. When\'s good this week?',context:'<strong>The message you\'ve been rewriting in your head.</strong> Speak the real feeling. Vokal articulates it — direct without aggression, honest without drama.',tag:'Personal'},
  ]},
  {cat:'Non-native English',items:[
    {title:'Professional email in English',save:'Hours of second-guessing',freq:'Daily',persona:'1.1B professionals',before:'I want write to client that project is going good and we will deliver on time, I also want to mention small issue with requirement that we discover, please can we have call...',after:'Hi James, I wanted to share a quick progress update — the project is on track for the agreed delivery date. We did identify one requirement ambiguity worth clarifying together. Would you be open to a brief call this week?',context:'<strong>Not a translation. An upgrade.</strong> Speak naturally in whatever way feels comfortable. Vokal produces fluent, professional English in your voice — not a generic template.',tag:'Email'},
    {title:'LinkedIn in English',save:'Barrier removed',freq:'Weekly',persona:'Global professionals',before:'I want to share about building product in India, that Indian engineers are very talented but we are not getting enough visibility internationally, I think this needs to change...',after:'"Indian engineering talent is world-class.\nBut international visibility is not.\n\nBrilliant colleagues build products that solve real problems — and struggle to be heard outside their geography.\n\nThat gap is cultural, not technical. And it\'s fixable."',context:'<strong>Post with confidence.</strong> The fear of embarrassing mistakes disappears. Vokal produces polished English that sounds like you at your best.',tag:'LinkedIn'},
    {title:'Meeting preparation',save:'30 min of anxiety',freq:'Before important meetings',persona:'Non-native speakers',before:'I want to propose European market expansion, main reason is our product is already English so it\'s natural fit, and I have data showing 40% of trial users are from Europe...',after:'Proposal: European Market Expansion. Key argument: Product is English-first — natural fit for European B2B. Evidence: 40% of trial users are European (organic). Ask: 3-month pilot with €50K marketing. Start: UK, expand to DACH in Q4.',context:'<strong>Walk in prepared.</strong> Speak the position in whatever feels natural. Walk in with polished talking points in professional English.',tag:'Presentation'},
    {title:'Negotiation email',save:'Confidence + outcome',freq:'As needed',persona:'Non-native speakers',before:'I want to tell them our price is already good and we cannot reduce more, but maybe we can give extra features or longer support, I don\'t want to sound like I\'m begging...',after:'Thank you for the feedback on pricing. Our rate reflects the integration depth and support commitment. We\'re not in a position to adjust the base price — but I\'d be happy to discuss adding extended onboarding support or an additional user seat.',context:'<strong>Negotiate from strength.</strong> The ideas are there. Vokal expresses them with the authority and precision that changes outcomes.',tag:'Email'},
  ]},
];

let ucCatIdx = 0, ucItemIdx = 0, ucAutoTimer;

function renderUcList(catIdx) {
  const cat = UC_DATA[catIdx];
  const list = document.getElementById('ucList');
  if (!list) return;
  list.innerHTML = cat.items.map((item, i) => `
    <button type="button" class="uc-item${i === ucItemIdx ? ' active' : ''}" onclick="selectUcItem(${i})">
      <div class="uc-item-title">${item.title}<span class="uc-item-arrow">→</span></div>
      <div class="uc-item-save">${item.save}</div>
    </button>`).join('');
}

function renderUcDetail(catIdx, itemIdx) {
  const item = UC_DATA[catIdx].items[itemIdx];
  const inner = document.getElementById('ucDetailInner');
  if (!inner) return;
  inner.innerHTML = `
    <div class="uc-detail-eyebrow">${UC_DATA[catIdx].cat}</div>
    <div class="uc-detail-title">${item.title}</div>
    <div class="uc-tags">
      <span class="uc-tag uc-tag-persona">${item.persona}</span>
      <span class="uc-tag uc-tag-freq">${item.freq}</span>
      <span class="uc-tag uc-tag-save">⏱ ${item.save}</span>
    </div>
    <div class="uc-transform">
      <div class="uc-before">
        <div class="uc-ba-label">You said</div>
        <div class="uc-ba-text">"${item.before}"</div>
      </div>
      <div class="uc-arrow-mid">
        <div class="uc-arrow-icon">→</div>
        <div class="uc-arrow-label">Vokal</div>
      </div>
      <div class="uc-after">
        <div class="uc-ba-label">${item.tag} · Generated</div>
        <div class="uc-ba-text">${item.after.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="uc-detail-footer">
      <div class="uc-detail-context">${item.context}</div>
      <a href="#waitlist" class="uc-try-btn">Try this →</a>
    </div>`;
  inner.style.animation = 'none';
  void inner.offsetHeight;
  inner.style.animation = '';
}

function selectUcCat(catIdx, el) {
  ucCatIdx = catIdx;
  ucItemIdx = 0;
  document.querySelectorAll('.uc-tab').forEach((t, i) => t.classList.toggle('active', i === catIdx));
  renderUcList(catIdx);
  renderUcDetail(catIdx, 0);
  clearInterval(ucAutoTimer);
  ucAutoTimer = setInterval(ucAutoCycle, 5000);
}

function selectUcItem(itemIdx) {
  ucItemIdx = itemIdx;
  document.querySelectorAll('.uc-item').forEach((el, i) => el.classList.toggle('active', i === itemIdx));
  renderUcDetail(ucCatIdx, itemIdx);
  clearInterval(ucAutoTimer);
}

function ucAutoCycle() {
  const cat = UC_DATA[ucCatIdx];
  ucItemIdx = (ucItemIdx + 1) % cat.items.length;
  renderUcList(ucCatIdx);
  renderUcDetail(ucCatIdx, ucItemIdx);
}

renderUcList(0);
renderUcDetail(0, 0);
ucAutoTimer = setInterval(ucAutoCycle, 5000);
