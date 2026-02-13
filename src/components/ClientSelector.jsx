import { useAuth } from '../contexts/AuthContext'

const ClientSelector = () => {
  const { isReseller, resellerClients, viewingClient, switchClient, userProfile } = useAuth()

  if (!isReseller || resellerClients.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto">
        <span className="text-xs text-white/50 whitespace-nowrap font-semibold uppercase tracking-wider">
          Viewing:
        </span>

        {/* Own company button */}
        <button
          onClick={() => switchClient(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
            !viewingClient
              ? 'bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25'
              : 'glass glass-border text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {userProfile?.company?.name || 'My Company'}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-white/20"></div>

        {/* Client buttons */}
        {resellerClients.map((client) => (
          <button
            key={client.id}
            onClick={() => switchClient(client)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              viewingClient?.client_company_id === client.client_company_id
                ? 'bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/25'
                : 'glass glass-border text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
              viewingClient?.client_company_id === client.client_company_id
                ? 'bg-white/20'
                : 'bg-white/10'
            }`}>
              {client.client_name?.charAt(0) || '?'}
            </div>
            {client.client_name}
            {client.status !== 'Active' && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                {client.status}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active client indicator */}
      {viewingClient && (
        <div className="max-w-7xl mx-auto mt-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-purple-300">
            Viewing <strong>{viewingClient.client_name}</strong>'s data — 
            documents, NCRs, audits and reviews shown are for this client only
          </span>
        </div>
      )}

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  )
}

export default ClientSelector
