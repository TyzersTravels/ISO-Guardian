-- Drip Campaign Seed Data
-- Run AFTER drip_campaigns_migration.sql
-- Seeds 3 campaigns from marketing/EMAIL_SEQUENCES.md

-- ============================================================
-- Campaign 1: Post-Assessment Nurture (5 emails over 14 days)
-- Trigger: User completes ISO readiness assessment on landing page
-- ============================================================
INSERT INTO drip_campaigns (slug, name, description, trigger_type, is_active, emails)
VALUES (
  'post-assessment',
  'Post-Assessment Nurture',
  'Nurture leads who complete the ISO readiness assessment. 5 emails over 14 days, personalized by score and standard.',
  'post_assessment',
  true,
  '[
    {
      "step": 1,
      "delay_days": 0,
      "subject": "Your ISO Readiness Score: {{score}}% — here''s what it means",
      "body": "Hi {{name}},\n\nThanks for completing the ISO readiness assessment on ISOGuardian.\n\nYour score: {{score}}%\nStandard assessed: {{standard}}\n\nHere''s what that means:\n\n• 0–40%: You''re in the early stages. Most of your documentation and processes need to be created from scratch. The good news? Starting from a clean slate means you can build it right the first time.\n\n• 41–70%: You have a foundation, but there are gaps. These gaps are exactly what auditors look for — and exactly what ISOGuardian helps you close.\n\n• 71–100%: You''re close. Fine-tuning your system and maintaining ongoing compliance is where ISOGuardian really shines.\n\nWant to see exactly which clauses need attention? ISOGuardian gives you a clause-by-clause compliance score and tells you what''s missing.\n\nStart your 14-day free trial — no credit card required:\nhttps://isoguardian.co.za/signup\n\nBest,\nTyreece"
    },
    {
      "step": 2,
      "delay_days": 2,
      "subject": "The #1 reason South African companies fail ISO audits",
      "body": "Hi {{name}},\n\nIt''s not missing documents. It''s not untrained staff.\n\nThe #1 reason companies fail ISO audits is: they can''t prove what they''re doing.\n\nAuditors don''t just want to see that you have a quality manual. They want to see:\n- Version-controlled documents with approval records\n- NCRs tracked from identification to verified closure\n- Management review minutes with action items\n- An audit trail showing who did what, when\n\nMost companies do these things — but in spreadsheets, shared drives, and email threads. When the auditor asks \"show me your NCR register,\" the scramble begins.\n\nISOGuardian puts all of this in one place, with automatic document numbering, audit trails, and compliance scoring.\n\nSee it in action (2-minute walkthrough):\nhttps://isoguardian.co.za/#features\n\nBest,\nTyreece"
    },
    {
      "step": 3,
      "delay_days": 5,
      "subject": "How {{company_name}} can go from {{score}}% to audit-ready",
      "body": "Hi {{name}},\n\nBased on your readiness score of {{score}}% for {{standard}}, here''s a practical roadmap:\n\nWeek 1-2: Document foundation\n- Upload existing procedures and policies\n- Identify gaps using clause-by-clause compliance scoring\n- Start creating missing documents (ISOGuardian has templates)\n\nWeek 3-4: Process implementation\n- Set up NCR tracking for any open non-conformances\n- Schedule your first internal audit\n- Assign document owners and review dates\n\nMonth 2-3: System maturity\n- Conduct management review (Clause 9.3)\n- Complete internal audit cycle\n- Close out NCRs with verified corrective actions\n\nMonth 4+: Certification readiness\n- All clauses scored and evidenced\n- Audit trail demonstrates ongoing compliance\n- Ready for Stage 1 certification audit\n\nThis timeline assumes you''re starting from {{score}}%. Companies using ISOGuardian typically reach certification readiness 40% faster than those using manual systems.\n\nReady to start? Your free trial gives you 14 days to explore:\nhttps://isoguardian.co.za/signup\n\nBest,\nTyreece"
    },
    {
      "step": 4,
      "delay_days": 9,
      "subject": "What our clients say about going from spreadsheets to ISOGuardian",
      "body": "Hi {{name}},\n\nI wanted to share what companies like yours have experienced after switching to ISOGuardian:\n\n\"We were managing ISO 9001 compliance across 3 different spreadsheets and a shared drive. Audit prep took weeks. With ISOGuardian, everything is in one place and we can pull up any document or NCR in seconds.\" — Quality Manager, Manufacturing\n\n\"The compliance scoring feature alone saved us. We could see exactly which clauses were covered and which had gaps. Our certification auditor commented on how well-organized our system was.\" — Operations Director, Engineering Services\n\n\"As a SHEQ consultant managing multiple clients, ISOGuardian''s multi-company view means I can switch between clients instantly. The reseller commission is a nice bonus too.\" — SHEQ Consultant\n\nThese aren''t enterprise companies with big budgets. They''re South African SMEs — just like yours — starting from R2,000/mo.\n\nTry it free for 14 days:\nhttps://isoguardian.co.za/signup\n\nBest,\nTyreece"
    },
    {
      "step": 5,
      "delay_days": 14,
      "subject": "Last thought on your ISO {{standard}} journey",
      "body": "Hi {{name}},\n\nThis is my last email in this series. I don''t believe in endless follow-ups.\n\nHere''s the simple truth: ISO compliance doesn''t have to be painful. The companies that struggle are the ones trying to manage it manually — documents in shared drives, NCRs in spreadsheets, audit evidence scattered across emails.\n\nISOGuardian exists to fix that. One platform, one source of truth, one place where your auditor can see everything.\n\nIf the timing isn''t right, no problem at all. But if you''re serious about {{standard}} certification, here are your options:\n\n1. Start a free trial: https://isoguardian.co.za/signup\n2. Book a free consultation: https://isoguardian.co.za/consultation\n3. Just reply to this email with any questions\n\nWhatever you decide, I wish you well on your compliance journey.\n\nBest,\nTyreece Kruger\nFounder, ISOGuardian"
    }
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  emails = EXCLUDED.emails,
  updated_at = now();

-- ============================================================
-- Campaign 2: Post-Consultation Nurture (3 emails)
-- Trigger: User submits consultation request form
-- ============================================================
INSERT INTO drip_campaigns (slug, name, description, trigger_type, is_active, emails)
VALUES (
  'post-consultation',
  'Post-Consultation Nurture',
  'Confirmation and follow-up for consultation requests. 1 auto-email, rest are event-triggered.',
  'post_consultation',
  true,
  '[
    {
      "step": 1,
      "delay_days": 0,
      "subject": "Your ISOGuardian consultation is booked",
      "body": "Hi {{name}},\n\nThanks for requesting a free consultation with ISOGuardian.\n\nHere''s what to expect:\n\n1. I''ll personally review your request within 24 hours\n2. You''ll receive a calendar invite for a 30-minute video call\n3. On the call, we''ll cover:\n   - Your current ISO compliance status\n   - Specific gaps based on your industry and standard\n   - How ISOGuardian can help (with a live demo)\n   - Honest assessment of whether we''re the right fit\n\nThis is a no-pressure conversation. If ISOGuardian isn''t right for you, I''ll tell you — and I''ll suggest alternatives that might work better.\n\nIn the meantime, feel free to explore the platform:\nhttps://isoguardian.co.za\n\nSpeak soon,\nTyreece Kruger\nFounder, ISOGuardian\n+27 [number] (WhatsApp available)"
    },
    {
      "step": 2,
      "delay_days": 1,
      "subject": "Preparing for your ISOGuardian consultation",
      "body": "Hi {{name}},\n\nQuick note before our call — to make the most of our 30 minutes, it helps if you have a rough idea of:\n\n- Which ISO standard(s) you''re targeting (9001, 14001, 45001)\n- How many employees / sites you have\n- Whether you have any existing documentation\n- Your target timeline for certification (if any)\n\nDon''t worry if you''re not sure on all of these — that''s what the consultation is for.\n\nSee you soon,\nTyreece"
    },
    {
      "step": 3,
      "delay_days": 3,
      "subject": "Following up on your consultation",
      "body": "Hi {{name}},\n\nThanks for taking the time to chat about your ISO compliance needs.\n\nAs discussed, here''s a summary of what we covered and your recommended next steps:\n\n1. Start your 14-day free trial to explore the platform\n2. Upload your existing documentation\n3. Run the compliance scoring to see where you stand\n\nIf you''d like to proceed, I''m here to help with onboarding:\nhttps://isoguardian.co.za/signup\n\nAny questions at all, just reply to this email.\n\nBest,\nTyreece"
    }
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  emails = EXCLUDED.emails,
  updated_at = now();

-- ============================================================
-- Campaign 3: Trial User Onboarding (4 emails over 14 days)
-- Trigger: User signs up for free trial
-- ============================================================
INSERT INTO drip_campaigns (slug, name, description, trigger_type, is_active, emails)
VALUES (
  'trial-onboarding',
  'Trial User Onboarding',
  'Activate trial users and convert to paid subscription. 4 emails over 14 days with usage-based personalization.',
  'trial_onboarding',
  true,
  '[
    {
      "step": 1,
      "delay_days": 0,
      "subject": "Welcome to ISOGuardian — let''s get you audit-ready",
      "body": "Hi {{name}},\n\nWelcome to ISOGuardian! Your 14-day free trial is active.\n\nHere are your first 3 steps (takes 10 minutes total):\n\n1. Upload your first document\nGo to Documents → Upload. Start with your quality manual or any key procedure.\n\n2. Check your compliance score\nGo to Compliance → Select your standard. See where you stand, clause by clause.\n\n3. Log an NCR (if you have any open)\nGo to NCRs → Create NCR. Track it from identification to closure.\n\nYour dashboard will start populating immediately.\n\nNeed help? Reply to this email or use the help button in the app (bottom-right corner).\n\nLet''s make your next audit a non-event.\n\nBest,\nTyreece"
    },
    {
      "step": 2,
      "delay_days": 3,
      "subject": "How''s your first week going?",
      "body": "Hi {{name}},\n\nYou''ve been on ISOGuardian for 3 days. Quick check-in:\n\nHave you uploaded any documents yet? That''s the best starting point — even uploading 5-10 key procedures will give you a compliance score instantly.\n\nQuick tip: Set up your first audit reminder. Go to Audits → Create Audit → set a future date. ISOGuardian will remind your team 7 days and 1 day before.\n\nQuestions? Just reply.\n\nTyreece"
    },
    {
      "step": 3,
      "delay_days": 7,
      "subject": "You''re halfway through your trial — here''s what you might have missed",
      "body": "Hi {{name}},\n\nYour free trial is half over. Here are 3 features you might not have explored yet:\n\n1. NCR lifecycle tracking — Open, assign, root cause, corrective action, verify, close. Full audit trail.\n\n2. Management reviews — Document your Clause 9.3 reviews with minutes, actions, and follow-ups.\n\n3. Data export — One-click export of all your compliance data (POPIA-compliant).\n\nIf ISOGuardian is working for you, your Starter plan is R2,000/mo with no setup fee.\n\nWant to discuss? Reply or WhatsApp me.\n\nBest,\nTyreece"
    },
    {
      "step": 4,
      "delay_days": 12,
      "subject": "Your trial ends in 2 days",
      "body": "Hi {{name}},\n\nYour ISOGuardian free trial expires on {{expiry_date}}.\n\nIf you''d like to continue, here''s what happens:\n- Your data is preserved (nothing is deleted)\n- Starter plan: R2,000/mo (1-10 users)\n- Growth plan: R3,700/mo (11-20 users)\n- No setup fee, cancel anytime after 12 months\n\nTo activate: Log in → Settings → Subscription → Choose plan\n\nIf you need more time to evaluate, just reply and I''ll extend your trial by 7 days. No questions asked.\n\nIf ISOGuardian isn''t right for you, no hard feelings. I''d genuinely appreciate knowing why — your feedback helps us improve.\n\nBest,\nTyreece Kruger\nFounder, ISOGuardian"
    }
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  emails = EXCLUDED.emails,
  updated_at = now();
