const LegalFooter = () => {
  return (
    <footer className="glass glass-border mt-auto py-6 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70 mb-4">
          <a href="/privacy-policy" className="hover:text-cyan-400 transition-colors">
            Privacy Policy
          </a>
          <span className="text-white/30">•</span>
          <a href="/paia-manual" className="hover:text-cyan-400 transition-colors">
            PAIA Manual
          </a>
          <span className="text-white/30">•</span>
          <a href="/terms" className="hover:text-cyan-400 transition-colors">
            Terms of Service
          </a>
          <span className="text-white/30">•</span>
          <a href="/upload-disclaimer" className="hover:text-cyan-400 transition-colors">
            Upload Disclaimer
          </a>
          <span className="text-white/30">•</span>
          <a href="/dpa" className="hover:text-cyan-400 transition-colors">
            Data Processing Agreement
          </a>
        </div>

        {/* ECTA Compliance Notice */}
        <div className="text-center text-xs text-white/50 mb-3 max-w-3xl mx-auto">
          <p className="mb-2">
            <strong className="text-white/70">ECTA Compliance:</strong> By using ISOGuardian, you acknowledge that you have read, 
            understood, and agree to be bound by our Terms of Service and Privacy Policy. Electronic records 
            and signatures are legally binding under the Electronic Communications and Transactions Act, 2002.
          </p>
        </div>

        {/* Copyright & Certifications */}
        <div className="text-center text-xs text-white/50 space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              POPIA Compliant
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ISO 27001 Ready
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              256-bit Encryption
            </span>
          </div>

          <div>
            © 2026 ISOGuardian (Pty) Ltd. All rights reserved.
          </div>
          
          <div className="text-white/40">
            Registered in South Africa • Powered by TyzerTheAdvisor
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </footer>
  )
}

export default LegalFooter
