import PublicLayout from '../components/PublicLayout'

const TermsOfService = () => {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-cyan-200">ISOGuardian (Pty) Ltd | Registration: 2026/082362/07</p>
          <p className="text-white/50 text-sm mt-2">Effective Date: January 2026 | Last Updated: February 2026 | Version 1.1</p>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>By accessing and using ISOGuardian (&ldquo;the Service&rdquo;), you accept and agree to be bound by these Terms of Service, our <a href="/privacy" className="text-cyan-400 underline">Privacy Policy</a>, <a href="/popia" className="text-cyan-400 underline">POPIA Compliance Policy</a>, and <a href="/paia" className="text-cyan-400 underline">PAIA Manual</a> (collectively, &ldquo;the Terms&rdquo;). If you do not agree, do not use the Service. If acting for a company, you warrant authority to bind it.</p>
            <p>These Terms are governed by the laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 (CPA), the Protection of Personal Information Act 4 of 2013 (POPIA), and the Electronic Communications and Transactions Act 25 of 2002 (ECTA).</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>ISOGuardian is a cloud-based ISO compliance management platform that provides:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ISO compliance management across ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018</li>
              <li>Document management &mdash; upload, store, organise, and retrieve ISO documentation with automated numbering and Activity Trail logging</li>
              <li>Non-Conformance Report (NCR) tracking &mdash; full lifecycle management from creation through corrective action to closure</li>
              <li>Audit scheduling and management &mdash; internal and external audit scheduling with close-out documentation per ISO 19011:2018</li>
              <li>Management review scheduling and documentation per ISO 9001:9.3, including meeting minutes, decisions, and action items</li>
              <li>Compliance scoring and reporting across all supported standards, organised by clause</li>
              <li>Activity Trail &mdash; comprehensive audit logging for ISO 7.5.3 traceability</li>
              <li>Branded PDF document exports with company branding and signature blocks</li>
            </ul>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-purple-500/10">
          <h2 className="text-xl font-bold text-white mb-4">3. Platform Development &amp; Future Features</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>ISOGuardian is an actively developed platform. We continuously enhance the Service by adding new features, improving existing functionality, and expanding standards coverage. Planned enhancements may include (without limitation): document generation, digital signatures, automated notifications, additional ISO standards (including ISO 27001), and AI-powered compliance advisory tools.</p>
            <p><strong>No Commitment:</strong> References to planned or future features do not constitute a commitment that such features will be delivered by any specific date. Your subscription covers all features available on the Platform at the time of use. New features are made available to subscribers as they are released.</p>
            <p><strong>Feature Changes:</strong> We reserve the right to modify, enhance, or retire features with thirty (30) days&rsquo; notice. Core functionality as described in your Client Subscription Agreement will not be removed during your subscription term without equivalent replacement.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">4. User Responsibilities</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate information and maintain its accuracy</li>
              <li>Keep credentials confidential and notify us of any suspected unauthorised access</li>
              <li>Use the Service in compliance with all applicable South African laws</li>
              <li>Ensure personal information uploaded has a lawful basis under POPIA</li>
              <li>Not reverse-engineer, decompile, or derive source code of the Platform</li>
              <li>Not upload malicious content or material infringing third-party IP rights</li>
              <li>Maintain your own backups of critical data</li>
            </ul>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">5. Data Ownership &amp; License</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Your Data:</strong> You retain all rights to data you upload to ISOGuardian.</p>
            <p><strong>License Grant:</strong> You grant us a limited licence to store, process, and display your data solely for providing the Service.</p>
            <p><strong>Our IP:</strong> The Platform, including software, design, templates, branded export formats, and documentation, is owned by ISOGuardian (Pty) Ltd. You are granted a non-exclusive, non-transferable licence for the duration of your subscription.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-red-500/10">
          <h2 className="text-xl font-bold text-white mb-4">6. Limitation of Liability</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p className="font-semibold text-red-300">IMPORTANT &mdash; READ CAREFULLY:</p>
            <p>ISOGuardian is a <strong>management tool designed to assist</strong> with compliance management. It does not guarantee:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ISO certification or audit success</li>
              <li>100% compliance with any standard</li>
              <li>Elimination of all compliance risks</li>
              <li>That any feature will produce a particular regulatory outcome</li>
            </ul>
            <p className="mt-3"><strong>Your responsibility:</strong> You remain solely responsible for achieving and maintaining compliance. Consult qualified professionals for compliance decisions.</p>
            <p className="mt-3"><strong>Exclusion:</strong> To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill.</p>
            <p className="mt-3"><strong>Maximum Liability:</strong> Our total aggregate liability shall not exceed fees paid by you in the 12 months preceding the claim.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">7. Service Availability</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Uptime Target:</strong> We target 99% monthly uptime. This excludes scheduled maintenance, force majeure, and third-party outages.</p>
            <p><strong>Maintenance:</strong> Communicated at least 48 hours in advance where practicable.</p>
            <p><strong>Support:</strong> Email support during business hours (Monday&ndash;Friday, 08:00&ndash;17:00 SAST, excl. SA public holidays).</p>
            <p><strong>Service Credits:</strong> Where a Client Subscription Agreement applies, service credits are specified therein.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">8. Payment &amp; Subscription</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Billing:</strong> Subscription-based. Plans detailed on the website or in your Client Subscription Agreement. All amounts in ZAR, exclusive of VAT.</p>
            <p><strong>Payment:</strong> Due in advance on the 1st of each month via EFT. Late payment beyond 7 days may restrict access; beyond 14 days, suspension.</p>
            <p><strong>Price Changes:</strong> Once per annum with 30 days&rsquo; notice. Increases capped at 10% or CPI + 2%, whichever is greater.</p>
            <p><strong>Fixed-Term:</strong> Where a 12-month agreement applies, early cancellation is subject to early termination provisions in your Subscription Agreement.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">9. Cancellation &amp; Refunds</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>CPA Cooling-Off:</strong> Where the CPA applies (distance selling), cancel within 5 business days of signup for a full refund less prorated usage.</p>
            <p><strong>Fixed-Term:</strong> Early cancellation subject to a reasonable termination fee per your Subscription Agreement, calculated per CPA Section 14.</p>
            <p><strong>Month-to-Month:</strong> Cancel with 30 days&rsquo; written notice. Effective at end of billing cycle.</p>
            <p><strong>No Partial Refunds:</strong> No refunds for partial months or unused time, except where required by law.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">10. Account Termination</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>By You:</strong> Contact support to terminate your account.</p>
            <p><strong>By Us:</strong> We may suspend or terminate for breach, non-payment exceeding 30 days, fraud, or abuse. 14 days&rsquo; notice and opportunity to remedy provided for breach.</p>
            <p><strong>Data Retention:</strong> Data retained for 30 days post-termination for export, then permanently deleted unless legal retention applies.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">11. Data Protection &amp; POPIA</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>We process personal information under POPIA. You are the Responsible Party; ISOGuardian is the Operator.</p>
            <p><strong>Data Hosting:</strong> Supabase infrastructure in the EU (London), compliant under POPIA Section 72.</p>
            <p><strong>Security:</strong> AES-256 encryption at rest, TLS in transit, Row Level Security, role-based access, audit logging, CAPTCHA protection.</p>
            <p><strong>Breach Notification:</strong> Within 72 hours per POPIA Section 22.</p>
            <p>Full details in our <a href="/popia" className="text-cyan-400 underline">POPIA Policy</a> and <a href="/paia" className="text-cyan-400 underline">PAIA Manual</a>.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">12. Security</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>Commercially reasonable security measures including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>AES-256 encryption at rest and TLS 1.2+ in transit</li>
              <li>Row Level Security (RLS) for multi-tenant data isolation</li>
              <li>Role-based access controls with company-scoped permissions</li>
              <li>Comprehensive audit logging of all actions</li>
              <li>Cloudflare Turnstile CAPTCHA</li>
              <li>Session management with automatic timeout</li>
            </ul>
            <p className="mt-2">No method of transmission or storage is 100% secure. We maintain commercially acceptable safeguards.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">13. Changes to Terms</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>We may update these Terms with 30 days&rsquo; written notice per CPA Section 14(2)(b)(i)(bb). Material changes communicated via email. Continued use after the notice period constitutes acceptance. If you disagree, you may terminate per Clause 9.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">14. Force Majeure</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>Not liable for failure or delay caused by events beyond reasonable control: acts of God, disasters, power outages, internet failures, government actions, pandemics, civil unrest, or third-party provider outages.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">15. Governing Law</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>South African law applies. Disputes first to mediation in Gauteng; if unresolved within 30 days, to the courts of South Africa, Gauteng Division.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">16. Miscellaneous</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>These Terms, together with your Client Subscription Agreement (if applicable), Privacy Policy, and PAIA Manual, constitute the entire agreement. Invalid provisions do not affect the remainder. No waiver effective unless written. We may assign to a successor; you may not assign without our consent. Electronic signatures recognised per ECTA.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-cyan-500/10">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Information Officer &amp; Director:</strong> Tyreece Kruger</p>
            <p><strong>Support &amp; Legal:</strong> support@isoguardian.co.za</p>
            <p><strong>POPIA / PAIA Queries:</strong> support@isoguardian.co.za</p>
            <p><strong>Address:</strong> 1 Goodwood Avenue, Comet, Boksburg, Gauteng, 1459</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <p className="text-white/60 text-xs">
            ISOGuardian (Pty) Ltd | Registration: 2026/082362/07 | VAT: Pending<br />
            Version 1.1 | Last Updated: 20 February 2026
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}

export default TermsOfService
