// Dynamic CORS — allows both apex and www subdomain, plus localhost for dev
export function getCorsHeaders(req?: Request) {
  const origin = req?.headers?.get('origin') || ''
  const allowed = [
    'https://isoguardian.co.za',
    'https://www.isoguardian.co.za',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]
  const resolvedOrigin = allowed.includes(origin) ? origin : 'https://isoguardian.co.za'
  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }
}

// Static fallback for existing imports
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://isoguardian.co.za',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auditor-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
