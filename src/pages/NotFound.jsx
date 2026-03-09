import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <img
            src="/isoguardian-logo.png"
            alt="ISOGuardian"
            className="w-16 h-16 mx-auto rounded-xl mb-4"
          />
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            404
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-white/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 glass glass-border rounded-xl text-white hover:bg-white/20 transition-colors font-semibold"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary px-6 py-2.5 rounded-xl font-semibold"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
