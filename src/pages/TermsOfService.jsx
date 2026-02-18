import Layout from '../components/Layout'

const TermsOfService = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-cyan-200">
            Last Updated: February 2026
          </p>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>
              By accessing and using ISOGuardian ("the Service"), you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>ISOGuardian provides:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ISO compliance management software (ISO 9001, 14001, 45001)</li>
              <li>Document management and version control</li>
              <li>Non-conformance report (NCR) tracking</li>
              <li>Audit scheduling and management</li>
              <li>Compliance scoring and reporting</li>
            </ul>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">3. User Responsibilities</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use the Service in compliance with all applicable laws and regulations</li>
              <li>Not attempt to gain unauthorized access to the Service</li>
              <li>Not upload malicious content or viruses</li>
              <li>Not use the Service for any illegal or unauthorized purpose</li>
            </ul>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">4. Data Ownership & License</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Your Data:</strong> You retain all rights to the data you upload to ISOGuardian.</p>
            <p><strong>License Grant:</strong> You grant us a limited license to store, process, and display your data solely for the purpose of providing the Service.</p>
            <p><strong>Our IP:</strong> The Service, including software, design, and documentation, is owned by ISOGuardian and protected by intellectual property laws.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-red-500/10">
          <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p className="font-semibold text-red-300">IMPORTANT - READ CAREFULLY:</p>
            <p>
              ISOGuardian is a <strong>tool to assist</strong> with compliance management. It does not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>ISO certification or audit success</li>
              <li>100% compliance with any standard</li>
              <li>Elimination of all compliance risks</li>
            </ul>
            <p className="mt-3">
              <strong>Your responsibility:</strong> You remain solely responsible for achieving and maintaining compliance with ISO standards and all applicable regulations.
            </p>
            <p className="mt-3">
              <strong>No Liability:</strong> To the maximum extent permitted by law, ISOGuardian and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Service.
            </p>
            <p className="mt-3">
              <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount paid by you for the Service in the 12 months preceding the claim.
            </p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">6. Service Availability</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Uptime Target:</strong> We aim for 99.9% uptime but do not guarantee uninterrupted access.</p>
            <p><strong>Maintenance:</strong> Scheduled maintenance will be communicated in advance when possible.</p>
            <p><strong>Support:</strong> Support is provided via email during business hours (Monday-Friday, 08:00-17:00 SAST).</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">7. Payment & Subscription</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Billing:</strong> Subscriptions are billed monthly per user.</p>
            <p><strong>Pricing:</strong> Current pricing is available on request.</p>
            <p><strong>Refunds:</strong> Refunds are handled on a case-by-case basis within 14 days of payment.</p>
            <p><strong>Cancellation:</strong> You may cancel anytime. Access continues until the end of the current billing period.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">8. Account Termination</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>By You:</strong> You may terminate your account at any time through the Service or by contacting support.</p>
            <p><strong>By Us:</strong> We may terminate your account for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Violation of these Terms</li>
              <li>Non-payment</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse of the Service</li>
            </ul>
            <p><strong>Data Retention:</strong> After termination, data is retained for 30 days then permanently deleted.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">9. Data Protection & POPIA</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>We process personal information in accordance with the Protection of Personal Information Act (POPIA), 2013.</p>
            <p>See our <a href="/popia" className="text-cyan-400 underline">POPIA Compliance Policy</a> for details.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">10. Security</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>256-bit AES encryption for data in transit and at rest</li>
              <li>Multi-tenant data isolation</li>
              <li>Regular security audits</li>
              <li>Secure backup and disaster recovery</li>
            </ul>
            <p className="mt-2">However, no method of transmission or storage is 100% secure. You use the Service at your own risk.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">11. Changes to Terms</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>We may update these Terms at any time. Material changes will be communicated via:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Email notification to your registered address</li>
              <li>In-app notification</li>
              <li>Notice on this page (with updated "Last Updated" date)</li>
            </ul>
            <p className="mt-2">Continued use after changes indicates acceptance of the new Terms.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">12. Governing Law</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p>These Terms are governed by the laws of the Republic of South Africa.</p>
            <p>Disputes shall be resolved in the courts of South Africa.</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-cyan-500/10">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Support:</strong> krugerreece@gmail.com</p>
            <p><strong>Legal:</strong> krugerreece@gmail.com</p>
            <p><strong>POPIA Queries:</strong> krugerreece@gmail.com</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <p className="text-white/60 text-xs">
            ISOGuardian<br />
            Registration: 2026/082362/07<br />
            VAT Number: Pending Registration<br />
            Last Updated: February 18, 2026
          </p>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Layout>
  )
}

export default TermsOfService
