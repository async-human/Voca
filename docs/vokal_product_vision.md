# Vokal — Product Vision & Phased Implementation Roadmap

**Version:** 1.0  
**Date:** May 2026  
**Author:** Harshal  
**Status:** Working document

---

## Table of Contents

1. [The Vision](#1-the-vision)
2. [The Core Insight](#2-the-core-insight)
3. [The Problem With AI Writing Tools Today](#3-the-problem-with-ai-writing-tools-today)
4. [What Makes Vokal Different](#4-what-makes-vokal-different)
5. [The Three Habit Loops](#5-the-three-habit-loops)
6. [The Compounding Moat](#6-the-compounding-moat)
7. [Retention Mechanics](#7-retention-mechanics)
8. [Technical Architecture Overview](#8-technical-architecture-overview)
9. [Phase 1 — Core Pipeline MVP](#9-phase-1--core-pipeline-mvp)
10. [Phase 2 — Gmail Integration & Daily Communicator Loop](#10-phase-2--gmail-integration--daily-communicator-loop)
11. [Phase 3 — Platform Delivery Layer](#11-phase-3--platform-delivery-layer)
12. [Phase 4 — Agentic Pipeline Upgrade](#12-phase-4--agentic-pipeline-upgrade)
13. [Phase 5 — Habit Infrastructure](#13-phase-5--habit-infrastructure)
14. [Phase 6 — The Communication OS](#14-phase-6--the-communication-os)
15. [Success Metrics by Phase](#15-success-metrics-by-phase)
16. [Competitive Positioning](#16-competitive-positioning)
17. [Revenue Model](#17-revenue-model)
18. [The North Star](#18-the-north-star)

---

## 1. The Vision

Vokal is not a writing tool. It is not a voice-to-text app. It is not an AI assistant.

**Vokal is a communication operating system** that sits between a person's brain and every platform they communicate on. It learns how they think, how they express themselves, and how they want to be perceived — and over time, it closes the gap between the two.

The final vision: a professional opens their phone in the morning. They have 12 emails to respond to, 3 Slack threads to address, a LinkedIn post they've been meaning to write, and a thought they had in the shower they want to capture. They don't open Gmail. They don't open Slack. They don't open a notes app. They open Vokal — or more accurately, Vokal is already open, already listening, already part of how they move through their day.

Every communication they send has been spoken, refined, and delivered. Their voice profile has been building for 6 months. The output sounds more like them than anything they would have written themselves on a Tuesday morning under deadline pressure. And every week, they get a report showing them exactly how their communication has improved — patterns they've broken, blind spots they've fixed, the specific ways they've become a sharper communicator.

After 60 days, switching to any other product would mean losing everything Vokal knows about them. That loss is too high. Vokal has become infrastructure.

---

## 2. The Core Insight

There is a gap between what people think and what they can express in writing.

This gap exists for everyone — but it is especially wide for:

- **Knowledge workers** under time pressure who think faster than they type
- **Non-native English speakers** (1.1 billion professionals) for whom writing polished professional English requires disproportionate effort
- **People who communicate in multiple registers** — the same person writes emails to their CEO, Slack messages to their team, LinkedIn posts for their network, and journal entries for themselves — and each register requires a different voice

Every existing tool addresses the symptom (poorly written text) rather than the cause (the gap between thought and expression). Grammarly fixes mistakes. ChatGPT writes for you. Whisper transcribes. None of them learn your voice, close the gap, or make you a better communicator over time.

Vokal addresses the cause directly. It starts from your voice — literally — and builds a model of how you think and communicate. Over time, the gap closes. Not because Vokal is doing more of the work, but because you are internalising the patterns and becoming a better communicator as a result.

---

## 3. The Problem With AI Writing Tools Today

### The Try-Once-And-Forget Problem

Every AI writing tool launched in the last 3 years has the same user lifecycle:

- **Week 1:** "This is amazing, it wrote my email perfectly"
- **Week 2:** "Cool, I use it occasionally"
- **Week 3:** Back to writing emails themselves

The reason is structural. These tools solve a *task* not a *habit*. The user has to consciously decide to open them. There is no trigger, no routine, no compulsion to return. They are destinations rather than infrastructure.

### The Dependency Problem

The tools that do retain users — ChatGPT, Grammarly — retain them by creating dependency, not growth. The user cannot write without Grammarly checking them. The user cannot compose without ChatGPT suggesting. They are not better communicators after 6 months of use. They are more dependent communicators.

This is a fundamentally different relationship than what Vokal is building. Vokal's value proposition is that the user gets sharper over time. The explanation layer — showing why every change was made — is the mechanism by which this happens. After 60 sessions, the user has internalised the patterns. They write better emails even when they don't use Vokal. That is the product.

### The Voice Problem

Every AI writing tool produces output that sounds like AI. The user submits a draft, it comes back sanitised, professional, generic. Colleagues notice. The writing loses the personality and specificity that made it trustworthy.

Vokal starts from voice — literally the user's spoken thoughts — and preserves the authentic signal while improving the structure and clarity. The output sounds like the user, not like a language model.

### The Fragmentation Problem

A professional's communication is fragmented across 6-10 platforms. Gmail, Slack, WhatsApp, LinkedIn, Notion, Instagram, Twitter, iMessage. Every tool addresses one platform. Nobody has built the layer that sits above all of them.

---

## 4. What Makes Vokal Different

There are five things Vokal does that no competitor does simultaneously:

**1. Starts from voice, not text**
No blank page. No prompt to write. The user speaks naturally — messy, rambling, half-formed — and Vokal handles everything from there. The barrier to starting is zero.

**2. Understands intent, not just words**
Vokal does not transcribe and clean. It extracts the goal, the audience, the appropriate tone, and what should be omitted, before generating a single word of output. The output is shaped by what the user was trying to achieve, not just what they said.

**3. Learns the user's voice over time**
After every session, Vokal updates a voice profile — vocabulary, tone, directness, warmth, formality, recurring patterns, blind spots. By session 30, the output is so personalised it would take a competitor months to replicate. This is the switching cost.

**4. Explains every change**
Every output comes with an explanation of what was changed and why. This is the coaching loop. Over time, users internalise these patterns. They become better communicators even when not using Vokal. No competitor has this.

**5. Delivers to the destination**
Vokal does not just generate. It sends. The user speaks a reply to an email; Vokal drafts and sends it. The user speaks a thought; Vokal saves it to Notion. The user speaks a LinkedIn post; Vokal drafts and schedules it. The job is complete. No copy-paste.

---

## 5. The Three Habit Loops

Vokal serves three distinct user archetypes, each with a different habit pattern. The product must be designed to support all three, but implementation should be sequential — own one loop completely before expanding to the next.

---

### Loop 1 — The Daily Communicator

**Who:** Knowledge workers, managers, founders who send 30-60+ messages per day across email and Slack.

**Their pain:** Daily and acute. Email is exhausting. The blank compose window is a productivity killer. Writing a careful, political email to a senior stakeholder takes 20 minutes they don't have.

**Their trigger:** Already pre-existing. They open Gmail every morning. They open Slack every hour. The habit trigger exists — Vokal just needs to insert itself into it.

**Their usage pattern:** 3-8 sessions per day. Every email reply, every Slack message, every WhatsApp update to a client.

**Their retention driver:** The weekly insight showing patterns across their communication. "You buried your lead in 6 of 8 emails this week." That report makes them open Vokal on Monday morning with intention.

**Habit formation mechanism:** Widget on homescreen + share sheet extension in Gmail. The user never needs to consciously switch to Vokal. It appears when they need it, inside tools they already use.

**Platforms:** Gmail, Outlook, Slack, WhatsApp, iMessage

---

### Loop 2 — The Content Creator

**Who:** Founders, consultants, solopreneurs, executives who want to build a LinkedIn or social media presence but find consistency difficult.

**Their pain:** They have good ideas constantly — in the shower, during a run, after a meeting. By the time they sit down to write, the thought has lost its energy. Or they sit down to write and nothing comes. They post inconsistently and feel guilty about it.

**Their trigger:** A good thought in the moment. The habit Vokal creates is capture-in-the-moment — the user learns that when they have a good idea, the reflex is to speak it into Vokal immediately.

**Their usage pattern:** 1-3 sessions per day for capture, 1 session per week for polishing and posting. Weekly frequency.

**Their retention driver:** The streak counter ("you've posted 4 weeks in a row") and the hook score on every LinkedIn post. Seeing their engagement improve as their hook quality improves creates a reinforcement loop.

**Habit formation mechanism:** Homescreen widget for instant capture. LinkedIn direct posting. Scheduling queue so posts go out at optimal times.

**Platforms:** LinkedIn, Instagram, X/Twitter, Substack

---

### Loop 3 — The Thinker and Journaler

**Who:** Professionals who want to develop a thinking or journaling practice. Often people going through a transition — new job, promotion, starting a company, personal challenge. Frequently overlap with the other two loops.

**Their pain:** They want to journal but writing feels too slow and self-conscious. They have thoughts they want to capture but the friction of opening a notes app and typing defeats them before they start.

**Their trigger:** End of day. The habit Vokal builds is an evening ritual — 2-3 minutes of speaking before sleep. Over time this becomes as natural as brushing teeth.

**Their usage pattern:** Once daily, highly consistent once established. The most sticky loop because the value (seeing your own thinking patterns over months) only reveals itself over time, creating a powerful reason not to stop.

**Their retention driver:** Pattern detection. "You've mentioned feeling stuck at work 11 times this month" is the kind of insight that makes users feel the app truly knows them. It's also the feature most likely to create emotional attachment to the product.

**Habit formation mechanism:** Evening reminder notification (opt-in), automatic save to Notion/Obsidian, weekly synthesis email with thinking patterns.

**Platforms:** Notion, Obsidian, Apple Notes, Google Docs, Day One

---

## 6. The Compounding Moat

The voice profile is Vokal's primary competitive moat. But a moat only works if the user can feel it compounding.

### How the Voice Profile Builds

Every session contributes to the voice profile in four ways:

**Trait scores** — directness, conciseness, warmth, formality, authority. Updated as a rolling average after every session. These scores shape generation: a user with high warmth gets email openings that feel personal; a user with high directness gets short paragraphs and active sentences.

**Vocabulary model** — words the user uses and avoids. Phrases that are signature. Jargon they're comfortable with. Vokal stops suggesting words the user always deletes.

**Pattern library** — recurring communication mistakes. Lead burial. Hedging words. Passive voice. Excessive qualification. After session 10, Vokal knows the user's specific patterns and actively corrects for them.

**Format preferences** — how the user structures emails (greeting, context, ask, close). How they prefer their Slack messages (short or detailed). What their LinkedIn posts have in common. These templates become progressively personalised.

### Making the Moat Visible

The switching cost only works as a retention mechanism if the user can see and feel it. Two mechanisms make this visible:

**The before/after comparison** — at session 10 and session 30, Vokal shows the user a comparison: "Here is how your email would have looked when you started. Here is how it looks now." The delta is visceral. The thought of starting over with a competitor that doesn't know any of this is genuinely painful.

**The longitudinal insight report** — weekly email showing how the user's communication has evolved over time. Clarity score trend. Patterns broken. Patterns remaining. This creates both a reason to stay and a reason to keep using the product consistently (so the report stays accurate and interesting).

### The Switching Cost Calculation

After 60 days of daily use, the user has:
- 180+ sessions in their history
- A voice profile calibrated to their specific communication style
- A pattern library identifying their specific blind spots
- A clarity score baseline showing their improvement trajectory
- A longitudinal record of their thinking and communication evolution

Switching to any competitor means losing all of this and starting from scratch. For a product that gets better with use, the cost of switching increases non-linearly. By month 3, switching is genuinely unthinkable for engaged users. This is the moat.

---

## 7. Retention Mechanics

Retention must be designed into the product, not added as an afterthought. Four mechanics drive retention at different timescales.

### Daily — The Streak Counter

Visible on the homescreen widget and in the app. Number of consecutive days with at least one session. Breaks the streak and users feel the loss acutely. Simple but powerful — Duolingo built a $5B business partly on this mechanic.

### Weekly — The Insight Email

Every Sunday evening, a short email from Vokal covering the past week:
- Sessions recorded and formats used
- Clarity score vs last week and vs first week
- Top pattern identified this week with an example
- One specific improvement observed: "Your email openings are 40% stronger than 8 weeks ago"
- A prompt for the coming week: "This week, try to lead with the key ask before context"

This email serves three purposes. It brings inactive users back. It gives active users a reason to feel progress. It creates a natural weekly checkpoint that deepens engagement.

### Monthly — The Voice Report

A longer, richer version of the weekly email. Shows:
- How the voice profile has evolved
- Before/after output comparison from first session vs current
- Trait score changes with interpretation
- Patterns fully resolved and patterns still active
- Projected clarity score if current trajectory continues

The monthly report is the emotional touchstone. It is the moment users feel Vokal truly knows them.

### Behavioural — Pattern Alerts

Real-time notifications triggered by pattern detection:
- "You've used 'I think' or 'I believe' in 4 consecutive messages. This hedging reduces authority. Try leading with the assertion directly."
- "Your last 3 Slack messages were over 200 words. Your team responds faster to messages under 80 words."

These alerts feel like having a communication coach in your pocket. They create micro-moments of learning that users value and share.

---

## 8. Technical Architecture Overview

### Stack

| Layer | Technology | Purpose |
|---|---|---|
| API | FastAPI (Python) | Core backend |
| Database | Supabase (PostgreSQL) | Users, sessions, profiles |
| Auth | Supabase Auth | Email + Google OAuth |
| Storage | Supabase Storage | Audio files |
| Vector DB | Pinecone | Voice profile embeddings, session memory |
| Cache | Upstash Redis | Profile caching, rate limiting |
| STT | Deepgram Nova-3 | Primary speech-to-text |
| STT Fallback | OpenAI Whisper | Fallback for low-quality audio |
| LLM | GPT-4o | Generation, critique, explanation |
| Embeddings | text-embedding-3-small | Voice profile vectors |
| Email | Resend | Transactional + weekly digests |
| Subscriptions | Adapty | iOS/Android IAP, Stripe web |
| Deployment | Railway | FastAPI hosting |
| Workflow | LangGraph | Agentic pipeline orchestration |

### Pipeline Architecture

```
Audio Input
    ↓
Orchestrator Agent (LangGraph)
    ↓
STT Agent (Deepgram → Whisper fallback)
    ↓
Cleaner Agent (disfluency removal)
    ↓
Intent Agent ←→ Memory (Pinecone + Supabase)
    ↓
Generator Agent (format-aware, voice-matched)
    ↓
Critic Agent → [retry loop if score < 70]
    ↓
Explainer Agent (tags, rationale, clarity score)
    ↓
Delivery Agent (platform routing)
    ↓
Profile Updater (async, post-delivery)
    ↓
Pattern Detector (async, every 5 sessions)
```

### Database Schema (Core Tables)

```sql
users               -- extended from Supabase Auth
voice_profiles      -- trait scores, patterns, vocabulary model
sessions            -- every recording with full pipeline output
generations         -- output text, explanation JSON, clarity score
patterns            -- longitudinal pattern tracking
platform_connections -- OAuth tokens for Gmail, Slack, etc.
delivery_receipts   -- confirmation of every message sent
weekly_insights     -- pre-computed weekly reports
waitlist            -- pre-launch signups with UTM tracking
```

---

## 9. Phase 1 — Core Pipeline MVP

**Timeline:** Weeks 1-8 (complete or near-complete)  
**Goal:** Working end-to-end pipeline that transforms voice to polished output across 5 formats

### What to Build

- [x] FastAPI application structure
- [x] Supabase auth and database
- [x] Deepgram STT with Whisper fallback
- [x] Disfluency cleaning step
- [x] Intent extraction
- [x] Format-aware generation (Email, Slack, Report, LinkedIn, Journal)
- [x] Self-critique pass
- [x] Explanation layer with change tags
- [x] Basic voice profile (session count, weak patterns summary)
- [x] SSE streaming for live pipeline updates
- [x] Waitlist API with spam protection
- [x] Session history storage and retrieval
- [ ] Retry logic with tenacity on OpenAI calls
- [ ] Audio file cleanup after successful pipeline
- [ ] Deepen voice profile with trait scores

### Critical Fixes Before Phase 2

Before moving to Phase 2, three issues from the current codebase must be resolved:

**1. Blocking background tasks** — `run_pipeline` is synchronous but runs in FastAPI's `BackgroundTasks`. This will cause production failures under real load. Wrap in `asyncio.get_event_loop().run_in_executor()` or convert fully to async.

**2. Retry logic** — add `tenacity` with exponential backoff to all OpenAI calls. A single 429 rate limit currently kills the entire pipeline.

**3. Voice profile depth** — add rolling average clarity scores and weak pattern frequency counts. The profile currently overwrites rather than compounds.

### Phase 1 Exit Criteria

- 20 real users through the full pipeline
- Average pipeline completion time under 15 seconds
- Average clarity score above 75
- Zero production crashes over 48 hours of operation

---

## 10. Phase 2 — Gmail Integration & Daily Communicator Loop

**Timeline:** Weeks 9-14  
**Goal:** Vokal inserts itself into the daily email workflow. Users send emails from Vokal without touching Gmail.

### Why Gmail First

Gmail is the highest-frequency, highest-pain communication channel for knowledge workers. It is used every day, multiple times per day. Getting Vokal into the Gmail workflow means daily habit formation by default. It also has an excellent, well-documented OAuth API.

### What to Build

#### 10.1 OAuth Connection System

A token management system that handles connecting, refreshing, and revoking external platform credentials.

**New database table:**
```sql
platform_connections
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES users
  platform        text   -- 'gmail' | 'slack' | 'notion' etc
  access_token    text   -- encrypted
  refresh_token   text   -- encrypted
  token_expiry    timestamptz
  scope           text[]
  metadata        jsonb  -- email address, display name etc
  connected_at    timestamptz
  last_used_at    timestamptz
```

**New API endpoints:**
```
GET  /api/v1/connections              -- list user's connections
POST /api/v1/connections/gmail/auth   -- initiate OAuth flow
GET  /api/v1/connections/gmail/callback -- OAuth callback
DELETE /api/v1/connections/{platform} -- disconnect
```

**Token encryption:** Never store OAuth tokens in plain text. Use Supabase's built-in encryption or AES-256 with a secret key stored in environment variables.

#### 10.2 Gmail Delivery Agent

```python
# app/delivery/gmail.py

class GmailDelivery:
    def __init__(self, credentials: dict):
        self.service = build_gmail_service(credentials)
    
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        cc: str = None,
        reply_to_thread_id: str = None
    ) -> DeliveryReceipt:
        message = create_message(to, subject, body, cc)
        if reply_to_thread_id:
            message['threadId'] = reply_to_thread_id
        result = self.service.users().messages().send(
            userId='me', body=message
        ).execute()
        return DeliveryReceipt(
            platform='gmail',
            external_id=result['id'],
            status='sent',
            delivered_at=datetime.utcnow()
        )
    
    async def get_recent_threads(
        self,
        limit: int = 10
    ) -> list[EmailThread]:
        # Returns recent threads for context
        # Used to help Vokal understand pending replies
        pass
    
    async def create_draft(
        self,
        to: str,
        subject: str,
        body: str
    ) -> str:
        # Creates a draft in Gmail rather than sending
        # Safer default for new users
        pass
```

#### 10.3 Delivery Flow

The delivery flow adds one step to the existing pipeline — a confirmation step before anything is sent. The user must always approve before Vokal sends on their behalf.

```
User speaks → Pipeline runs → Output generated
    ↓
Preview screen (full output, editable)
    ↓
User taps "Send via Gmail"
    ↓
Gmail delivery agent sends
    ↓
Confirmation screen: "Sent to sarah@company.com"
    ↓
Saved to session history with delivery receipt
```

**Important:** Draft mode should be the default for first-time users. Create a Gmail draft rather than sending directly. After 5 successful drafts, offer the option to send directly. This builds trust before handing over full send authority.

#### 10.4 UI Changes

**Connection settings screen**
A new "Connections" section in the app settings. Shows connected platforms with status, last used time, and disconnect option. Shows available platforms with Connect button.

**Destination selector in Studio**
After picking the format (Email), a second selector appears: "Send to..." with connected destinations listed. For Gmail: the user's connected email address. Option to type a recipient email directly.

**Delivery confirmation screen**
After successful send: confirmation animation, sent-to address, link to view in Gmail, option to undo (within 30 seconds via Gmail's send undo feature).

#### 10.5 Reply Context

A powerful feature: when the user wants to reply to a specific email, they paste the email thread into Vokal (or connect via Gmail API to fetch it). The intent extraction step reads the original email as context, and the generated reply is shaped by what the original email said.

```python
# In intent extraction, add email context
if recording.get("reply_context"):
    prompt = INTENT_PROMPT_WITH_CONTEXT.format(
        transcript=clean_transcript,
        original_email=recording["reply_context"]["body"],
        sender=recording["reply_context"]["sender"]
    )
```

### Phase 2 Exit Criteria

- Gmail OAuth flow working end-to-end
- 10 users sending at least 1 email per day via Vokal
- Draft mode and direct send both working
- Reply context working for email thread replies
- Zero OAuth token errors in production over 7 days

---

## 11. Phase 3 — Platform Delivery Layer

**Timeline:** Weeks 15-22  
**Goal:** Expand delivery to Slack, Notion, LinkedIn. Cover the three core use cases: team communication, knowledge management, and content creation.

### Priority Order

| Platform | Reason | API Complexity |
|---|---|---|
| Slack | Daily use, excellent API | Low |
| Notion | Journaling loop, great API | Low |
| LinkedIn | Content creator loop, good API | Medium |
| Zapier webhook | Covers WhatsApp, Telegram, 5000+ apps | Low |
| Outlook | Enterprise market | Medium |
| Instagram | Content creator expansion | High |
| X/Twitter | Content creator expansion | High |

### 11.1 Slack Integration

Slack's API is the best in the category. OAuth2, well-documented, generous rate limits.

**What it enables:** The user speaks a Slack message, selects the workspace and channel, and Vokal sends it. For DMs, they select the recipient.

**Key implementation detail:** Slack messages have a different register than emails. The intent extraction step must detect Slack as the destination and apply the appropriate tone model — shorter, more casual, action-oriented. The format guide for Slack in the prompts already handles this.

**Slack-specific features:**
- Channel selection from connected workspace
- Thread reply support
- @mention detection (if the user says "at-Sarah" in their voice note, it becomes @Sarah in the Slack message)

### 11.2 Notion Integration

Notion's API allows creating pages in any database the user has access to.

**What it enables:** The journaling loop. User speaks at end of day, Vokal creates a new page in their Notion journal database with the date as the title, the structured output as the body, and tags based on the patterns detected.

**Notion-specific features:**
- Journal entry creation with auto-date title
- Tag creation based on detected patterns and themes
- Append mode for adding to existing pages
- Link back from session history to the Notion page

**Database structure Vokal creates in Notion:**
```
Vokal Journal (database)
  ├── Date (title property)
  ├── Mood (select property — detected by Vokal)
  ├── Themes (multi-select — from pattern detection)
  ├── Clarity Score (number)
  ├── Body (rich text — the polished output)
  └── Raw Transcript (toggle — the original words)
```

### 11.3 LinkedIn Integration

LinkedIn's API allows posting on behalf of connected accounts.

**What it enables:** The content creator loop. User speaks an idea, Vokal drafts a LinkedIn post with a strong hook, and the user posts it directly or schedules it.

**LinkedIn-specific features:**
- Hook score (0-100) shown before posting
- Estimated reach based on post length and format
- Hashtag suggestions based on content
- Optimal posting time suggestion
- Draft queue — multiple posts drafted then reviewed in one session

### 11.4 Zapier Webhook Integration

A single Zapier webhook integration is a force multiplier. It covers WhatsApp, Telegram, Discord, Airtable, Google Sheets, and 5,000+ other apps through the Zapier ecosystem.

**Implementation:** The user creates a Zap in Zapier with "Webhook by Zapier" as the trigger. They paste the webhook URL into Vokal. When Vokal has an output to deliver to that destination, it POSTs the content to the webhook. Zapier handles the final delivery.

**Why this matters:** WhatsApp has no official personal API. Telegram requires bot setup. Rather than building fragile unofficial integrations, Vokal offloads the complexity to Zapier. This ships in one afternoon.

### Phase 3 Exit Criteria

- Slack, Notion, LinkedIn, Zapier all working in production
- At least 30% of active users have connected at least one external platform
- Delivery success rate above 95%
- Zero data leaks or auth failures

---

## 12. Phase 4 — Agentic Pipeline Upgrade

**Timeline:** Weeks 23-28  
**Goal:** Replace the linear waterfall pipeline with a proper agentic system using LangGraph. Add quality gates, retry loops, and async side effects.

### Why This Phase Matters

The current pipeline is a sequential script. Every step runs regardless of what the previous step produced. If the transcript is 3 words of mumbling, the generator still fires. If the output scores 45 for clarity, it still ships. There is no reasoning, no self-correction, no quality gate.

An agentic pipeline adds three properties:

**1. The orchestrator decides what to do next** based on the output of each step, not just what step is next in the sequence.

**2. Agents retry with context** — if the critic scores below threshold, the orchestrator sends the draft back to the generator with the critique attached, and the generator tries again.

**3. Side effects are truly async** — profile updates, pattern detection, and insight generation happen after the user has their output, without blocking.

### What to Build

#### 12.1 Migrate to LangGraph

```python
from langgraph.graph import StateGraph

class VokalState(TypedDict):
    audio_url: str
    user_id: str
    output_format: str
    transcript: Optional[str]
    clean_transcript: Optional[str]
    intent: Optional[dict]
    voice_profile: Optional[dict]
    draft: Optional[str]
    critique: Optional[dict]
    output: Optional[str]
    explanation: Optional[dict]
    retries: int
    errors: list[str]

workflow = StateGraph(VokalState)

# Add nodes
workflow.add_node("transcribe", transcribe_node)
workflow.add_node("clean", clean_node)
workflow.add_node("intent", intent_node)
workflow.add_node("load_profile", load_profile_node)
workflow.add_node("generate", generate_node)
workflow.add_node("critique", critique_node)
workflow.add_node("explain", explain_node)
workflow.add_node("deliver", deliver_node)

# Conditional edge — retry or proceed
def should_retry(state: VokalState) -> str:
    score = state["critique"]["clarity_score"]
    retries = state["retries"]
    if score < 70 and retries < 2:
        return "generate"  # retry
    return "explain"  # proceed

workflow.add_conditional_edges("critique", should_retry, {
    "generate": "generate",
    "explain": "explain"
})
```

#### 12.2 Quality Gates

Each step returns a confidence signal. The orchestrator acts on it.

| Step | Signal | Action if Below Threshold |
|---|---|---|
| Transcription | word count, confidence score | Abort if < 5 words |
| Intent | intent clarity score | Retry with different prompt |
| Generation | draft length, coherence | Retry with context |
| Critique | clarity score | Retry generation with critique |
| Explanation | change count | Flag for review |

#### 12.3 Pattern Detection Agent

Runs asynchronously after every 5th session. Scans the user's last 20 explanation outputs. Identifies patterns appearing 3+ times. Updates the voice profile with confirmed patterns. Triggers a notification if a new strong pattern is found.

```python
async def pattern_detection_agent(user_id: str, session_id: str):
    # Runs after every 5th session
    explanations = await fetch_recent_explanations(user_id, limit=20)
    
    patterns = await llm.analyze_patterns(
        explanations=explanations,
        existing_patterns=await get_existing_patterns(user_id)
    )
    
    for pattern in patterns["new_patterns"]:
        if pattern["confidence"] > 0.75:
            await create_pattern(user_id, pattern)
            if pattern["confidence"] > 0.90:
                await send_pattern_notification(user_id, pattern)
    
    for pattern in patterns["resolved_patterns"]:
        await resolve_pattern(user_id, pattern["id"])
        await send_improvement_notification(user_id, pattern)
```

### Phase 4 Exit Criteria

- LangGraph pipeline in production
- Average clarity score above 82 (up from current ~75)
- Retry loop firing and improving scores measurably
- Pattern detection running reliably in background
- Pipeline p95 latency under 12 seconds

---

## 13. Phase 5 — Habit Infrastructure

**Timeline:** Weeks 29-36  
**Goal:** Build the mechanics that make Vokal part of daily life rather than an occasional tool.

### What to Build

#### 13.1 Homescreen Widget

A native iOS and Android widget that shows:
- Streak counter (days of consecutive use)
- One-tap record button that opens directly into Vokal with last-used format pre-selected
- Today's clarity score if a session has been recorded

The widget is the most important habit-formation feature. It means Vokal is visible on the user's homescreen every time they unlock their phone. The one-tap record button means the friction of starting a session drops from 5 steps to 1.

#### 13.2 Share Sheet Extension

An iOS and Android share sheet extension that allows users to share text into Vokal from any app. Primary use cases:

- In Gmail: select an email thread, share to Vokal, speak a reply
- In Slack: long-press a message, share to Vokal, speak a response
- In Safari: share an article to Vokal, speak a summary or reaction

The share sheet extension removes the need to switch apps. Vokal appears inside the workflow the user is already in.

#### 13.3 Weekly Insight Email

Automated Sunday evening email. Personalised based on the week's sessions.

**Template structure:**
```
Subject: Your week in communication, [name]

[WEEK SUMMARY]
You recorded [N] sessions this week.
Your clarity score averaged [score] — [up/down] [X]% from last week.

[THIS WEEK'S PATTERN]
[Pattern name]: [specific example from their sessions]
[One sentence explanation of why this matters]
[One sentence suggestion for next week]

[PROGRESS NOTE]
[Specific improvement observed with before/after example]

[LOOKING AHEAD]
One thing to try this week: [specific, actionable suggestion]
```

#### 13.4 Streak and Progress System

**Streak counter:** Consecutive days with at least one session. Visible in the app header and on the widget. Reset if no session for 24 hours. Optional grace period of 1 day per week to protect streaks for busy days.

**Milestone notifications:**
- 7-day streak: "One week. Your profile is starting to take shape."
- 30-day streak: "One month. Your voice profile is now significantly personalised."
- First resolved pattern: "You've broken a pattern. Here's what changed."
- Clarity score milestones: 60 → 70 → 80 → 90

**Progress visualisation in the app:**
- Clarity score sparkline over time
- Trait score changes month-over-month
- Pattern resolution timeline
- Session frequency heatmap (like GitHub contributions)

### Phase 5 Exit Criteria

- Widget live on iOS and Android
- Share sheet extension working for Gmail and Slack
- Weekly insight email open rate above 40%
- 30-day retention above 60% for active users (3+ sessions in week 1)

---

## 14. Phase 6 — The Communication OS

**Timeline:** Month 10 onwards  
**Goal:** Vokal is no longer an app users open. It is the layer through which they communicate.

### What This Looks Like

At this phase, a user's interaction with Vokal is ambient. They do not think "I will use Vokal now." They think "I need to reply to this email" and Vokal is simply how emails get replied to.

The key shifts:

**From destination to infrastructure.** Vokal lives in the share sheet, in the Gmail sidebar (Chrome extension), in the Slack sidebar (Slack app), in the Notion integration. It appears where the user already is.

**From format selection to automatic routing.** Vokal infers the format and destination from context. When the user speaks from inside Gmail, it knows they're writing an email. When they speak from inside Slack, it knows they're writing a Slack message. The user just speaks.

**From individual output to communication management.** At this scale, Vokal can see patterns across all of a user's communication — not just individual sessions. "Your last 10 messages to your manager have all been under 50 words. Your responses to direct reports are 3× longer. This asymmetry may be worth examining." This is the level of insight no competitor can approach.

### The Chrome Extension

A Chrome extension that adds a Vokal button to Gmail's compose window. The user clicks it, speaks, and the output fills the compose window. The extension also adds Vokal to LinkedIn's post composer and to any `<textarea>` on the web.

This is the ultimate distribution mechanism — Vokal becomes accessible from anywhere on the web with no app switching required.

### The Slack App

A native Slack app that adds `/vokal` as a slash command and a Vokal button to the message composer. The user types `/vokal` and speaks, or clicks the button and speaks. The message appears in the compose window for review before sending.

---

## 15. Success Metrics by Phase

### Phase 1 (Pipeline MVP)
- Pipeline completion rate: > 95%
- Average pipeline latency: < 15s
- Average clarity score: > 75
- 20 real beta users

### Phase 2 (Gmail Integration)
- Gmail connections per active user: > 0.4
- Emails sent via Vokal per week per active user: > 3
- Draft-to-send conversion: > 70%
- D30 retention: > 40%

### Phase 3 (Platform Layer)
- Platform connections per active user: > 1.5
- Cross-platform sessions (same user, multiple platforms): > 30% of users
- Delivery success rate: > 95%

### Phase 4 (Agentic Pipeline)
- Average clarity score: > 82
- Retry loop improvement (score delta per retry): > 8 points
- Pattern detection accuracy: > 80% user-confirmed relevance

### Phase 5 (Habit Infrastructure)
- D7 retention: > 65%
- D30 retention: > 50%
- Weekly insight email open rate: > 40%
- Average sessions per active user per week: > 5
- Streak length for retained users: > 14 days median

### Phase 6 (Communication OS)
- Chrome extension installs: > 5,000
- Daily active users / Monthly active users: > 0.4
- NPS: > 60
- Average revenue per user: > $12/month (net of churn)

---

## 16. Competitive Positioning

### The Landscape

| Product | What They Do | What They Miss |
|---|---|---|
| Wispr Flow | OS-level dictation, faster keyboard | No memory, no coaching, no delivery |
| Letterly | Voice to 27 rewrite formats | No personalisation, no learning |
| Voicenotes | Voice to content, basic summarisation | No longitudinal memory, no delivery |
| Grammarly | Grammar and style fixing | Dependency not growth, no voice |
| ChatGPT | General AI writing | Sounds like AI, no voice, no delivery |
| Otter | Transcription and meeting notes | No writing, no delivery |

### Vokal's Defensible Position

No competitor has all five of Vokal's core properties simultaneously:
1. Voice input as the primary modality
2. Intent extraction (not just transcription)
3. Longitudinal voice profile that compounds
4. Explanation layer that teaches
5. Platform delivery that completes the job

The first three are technically achievable by a well-funded competitor in 6-12 months. The fourth requires a product philosophy that most teams won't adopt (most AI companies prefer dependency over growth). The fifth requires distribution partnerships that take time to build.

**The window is 12-18 months** to establish the compounding moat before a well-funded competitor can replicate the full stack. The priority is users and retention, not perfection.

---

## 17. Revenue Model

### Pricing

| Plan | Price | What's Included |
|---|---|---|
| Free | $0 | 10 sessions/month, 1 connected platform |
| Pro | $14/month | Unlimited sessions, 5 connected platforms, weekly insights |
| Power | $29/month | Everything in Pro + priority processing, team features, API access |

### Unit Economics (at $14/month Pro)

- API cost per session: ~$0.019
- At 10 sessions/day: $5.70/month
- Gross margin: ~59%
- Break-even users to cover $500/month infra: ~60 paying users

### Revenue Targets

| Milestone | Timeline | MRR | Paying Users |
|---|---|---|---|
| First revenue | Month 3 post-launch | $1,400 | 100 |
| Ramen profitable | Month 5 | $5,000 | 357 |
| 6-month target | Month 6 | $14,000 | 1,000 |
| 12-month target | Month 12 | $50,000 | 3,571 |
| Series A territory | Month 18 | $150,000 | 10,714 |

### Growth Levers

**Word of mouth** — the explanation layer creates shareable moments. "Look what Vokal told me about my writing" is inherently social.

**LinkedIn content** — the content creator loop creates a natural distribution channel. Every LinkedIn post created via Vokal is a potential product advertisement.

**Non-native English speaker communities** — targeted outreach to Indian, Southeast Asian, and European professional communities where the pain of writing in English is acute and the market is enormous.

**B2B expansion** — team features where managers can see anonymised communication patterns across their team. Enterprise pricing at $20-30/user/month.

---

## 18. The North Star

The north star metric for Vokal is not MAU, not MRR, not sessions.

It is **sessions per user per week** among users who have been active for more than 30 days.

This metric captures everything that matters:
- It requires the product to be genuinely useful (users keep coming back)
- It requires the product to form a habit (frequency, not just occasional use)
- It requires the compounding to be working (the product gets more valuable the longer you use it, so engaged users use it more)
- It filters out the "try once and forget" users who inflate vanity metrics

**Target:** 5+ sessions per week per 30-day-retained user.

A user recording 5 sessions per week is using Vokal every weekday. That is a daily habit. That is infrastructure. That is a user who, at month 3, genuinely cannot imagine not having Vokal as part of how they communicate.

Everything in this document — the habit loops, the retention mechanics, the delivery integrations, the compounding moat — is in service of that number. If that number is trending up, the product is working. If it is flat or declining, something in the habit formation stack is broken and needs to be rebuilt before expanding to the next phase.

**Vokal's mission is to be the product that closes the gap between what people think and what they can express. Not as a one-time fix. As a permanent upgrade.**

---

*This document should be reviewed and updated at the end of each phase. The vision is fixed. The implementation details are not.*
