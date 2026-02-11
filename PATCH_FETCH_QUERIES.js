// ============================================================
// DOCUMENTS PAGE - KEY FIX
// In your existing Documents.jsx, find the fetchDocuments function
// and change this line:
//
//   BEFORE (BROKEN):
//   query = query.eq('archived', false)
//   query = query.eq('permanently_deleted', false)   // or .eq('deleted', false)
//
//   AFTER (FIXED):
//   query = query.neq('archived', true)    // catches both false AND null
//   query = query.neq('deleted', true)     // catches both false AND null
//
// Same fix applies to Audits.jsx and ManagementReviews.jsx
// ============================================================

// Here's the corrected fetchDocuments function to drop in:

const fetchDocuments = async () => {
  try {
    setLoading(true)
    
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    // KEY FIX: Use .neq(true) instead of .eq(false) to handle NULLs
    query = query.neq('deleted', true)

    if (viewMode === 'active') {
      query = query.neq('archived', true)
    } else if (viewMode === 'archived') {
      query = query.eq('archived', true)
    }

    const { data, error } = await query
    if (error) throw error
    setDocuments(data || [])
  } catch (error) {
    console.error('Error fetching documents:', error)
  } finally {
    setLoading(false)
  }
}

// SAME PATTERN FOR AUDITS:
const fetchAudits = async () => {
  try {
    setLoading(true)
    
    let query = supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false })

    // KEY FIX
    query = query.neq('permanently_deleted', true)

    if (viewMode === 'active') {
      query = query.neq('archived', true)
    } else if (viewMode === 'archived') {
      query = query.eq('archived', true)
    }

    const { data, error } = await query
    if (error) throw error
    setAudits(data || [])
  } catch (error) {
    console.error('Error fetching audits:', error)
  } finally {
    setLoading(false)
  }
}
