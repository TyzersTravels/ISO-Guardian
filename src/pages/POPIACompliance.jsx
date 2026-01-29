import Layout from '../components/Layout'

const POPIACompliance = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-4">POPIA Compliance & Data Protection</h1>
          <p className="text-cyan-200">
            ISOGuardian is committed to protecting your personal information in accordance with the 
            Protection of Personal Information Act (POPIA), 2013.
          </p>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
          <div className="text-white/80 space-y-2 text-sm">
            <p><strong>Account Information:</strong> Name, email, company name, role</p>
            <p><strong>Compliance Data:</strong> Documents, NCRs, audit records, compliance scores</p>
            <p><strong>Usage Data:</strong> Login times, feature usage (for service improvement)</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">How We Protect Your Data</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-white/80">
                <div className="font-semibold text-white mb-1">256-bit Encryption</div>
                All data transmitted and stored is encrypted using industry-standard AES-256 encryption.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-white/80">
                <div className="font-semibold text-white mb-1">Multi-Tenant Isolation</div>
                Your company's data is completely isolated. Other companies cannot access your information.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-white/80">
                <div className="font-semibold text-white mb-1">Secure Data Centers</div>
                Data hosted in EU (London) on Supabase infrastructure with SOC 2 Type II certification.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-white/80">
                <div className="font-semibold text-white mb-1">Role-Based Access Control</div>
                Only authorized users within your company can access specific data based on their role.
              </div>
            </div>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Rights Under POPIA</h2>
          <div className="text-white/80 space-y-2 text-sm">
            <p>✅ <strong>Right to Access:</strong> Request a copy of all your data</p>
            <p>✅ <strong>Right to Correction:</strong> Update incorrect information</p>
            <p>✅ <strong>Right to Deletion:</strong> Request permanent deletion of your data</p>
            <p>✅ <strong>Right to Data Portability:</strong> Export your data in machine-readable format</p>
            <p>✅ <strong>Right to Object:</strong> Object to processing of your personal information</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Data Retention</h2>
          <div className="text-white/80 text-sm">
            <p className="mb-2">We retain your data for:</p>
            <p>• <strong>Active accounts:</strong> Duration of subscription + 30 days</p>
            <p>• <strong>Compliance records:</strong> As required by ISO standards (typically 3 years)</p>
            <p>• <strong>After account closure:</strong> 30 days grace period, then permanent deletion</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Third-Party Services</h2>
          <div className="text-white/80 text-sm space-y-2">
            <p><strong>Supabase (Database & Auth):</strong> EU servers, SOC 2 certified</p>
            <p><strong>Vercel (Hosting):</strong> Global CDN, ISO 27001 certified</p>
            <p className="mt-3 text-white/60">
              We do not sell, rent, or share your data with third parties for marketing purposes.
            </p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6 bg-cyan-500/10">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information Officer</h2>
          <div className="text-white/80 text-sm">
            <p className="mb-2">For any data protection queries or to exercise your rights:</p>
            <p><strong>Email:</strong> privacy@compliancehub.co.za</p>
            <p><strong>Response Time:</strong> Within 30 days as required by POPIA</p>
          </div>
        </div>

        <div className="glass glass-border rounded-2xl p-6">
          <p className="text-white/60 text-xs">
            Last Updated: January 2025<br />
            Information Regulator Registration: [Pending]<br />
            Company Registration: [Your Registration Number]
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

export default POPIACompliance
