import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { welcomeEmailHtml } from './emails/welcome.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json({ limit: '16kb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);

const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signup attempts. Please try again later.' },
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const useCases = new Set(['email', 'reports', 'linkedin', 'slack', 'journal', 'other']);

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'voca-api' });
});

app.get('/api/waitlist/count', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    res.json({ count: count ?? 0 });
  } catch (err) {
    console.error('Count error:', err);
    res.status(500).json({ error: 'Could not fetch waitlist count' });
  }
});

app.post('/api/waitlist', waitlistLimiter, async (req, res) => {
  try {
    const {
      email,
      use_case: useCase,
      source = 'landing',
      website,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
    } = req.body ?? {};

    if (website) {
      res.json({ ok: true, message: "You're on the list — we'll be in touch soon" });
      return;
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const normalizedUseCase = useCase && useCases.has(useCase) ? useCase : null;

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: normalizedEmail,
        use_case: normalizedUseCase,
        source: String(source).slice(0, 64),
        referrer: referrer ? String(referrer).slice(0, 512) : null,
        utm_source: utm_source ? String(utm_source).slice(0, 128) : null,
        utm_medium: utm_medium ? String(utm_medium).slice(0, 128) : null,
        utm_campaign: utm_campaign ? String(utm_campaign).slice(0, 128) : null,
      })
      .select('id, email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: "You're already on the waitlist." });
        return;
      }
      throw error;
    }

    if (resend && process.env.RESEND_FROM_EMAIL) {
      resend.emails
        .send({
          from: process.env.RESEND_FROM_EMAIL,
          to: normalizedEmail,
          subject: "You're on the Voca waitlist",
          html: welcomeEmailHtml({ email: normalizedEmail }),
        })
        .catch((err) => console.error('Resend error:', err));
    }

    res.status(201).json({
      ok: true,
      message: "You're on the list — we'll be in touch soon",
      id: data.id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.use((err, _req, res, next) => {
  if (err?.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Voca API listening on port ${port}`);
});
