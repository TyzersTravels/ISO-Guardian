export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://isoguardian.co.za',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auditor-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
