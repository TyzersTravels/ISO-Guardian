import { supabase } from './supabase';

/**
 * Generates a document number in format: IG-{COMPANY_CODE}-{TYPE}-{NUMBER}
 * e.g., IG-SH-DOC-001, IG-HQ-NCR-002, IG-SH-AUD-001
 * 
 * Also returns revision info:
 * - Revision: Rev 01 (increments annually on 31 January)
 * - Review Date: 31 January of the following year
 */

const TYPE_MAP = {
  document: 'DOC',
  ncr: 'NCR',
  audit: 'AUD',
  management_review: 'MR',
};

const COUNTER_MAP = {
  document: 'doc_counter',
  ncr: 'ncr_counter',
  audit: 'audit_counter',
  management_review: 'review_counter',
};

export const generateDocNumber = async (companyId, entityType) => {
  try {
    // Get company code and current counter
    const { data: company, error } = await supabase
      .from('companies')
      .select('company_code, doc_counter, ncr_counter, audit_counter, review_counter')
      .eq('id', companyId)
      .single();

    if (error || !company) throw error || new Error('Company not found');

    const prefix = TYPE_MAP[entityType] || 'DOC';
    const counterField = COUNTER_MAP[entityType] || 'doc_counter';
    const currentCount = (company[counterField] || 0) + 1;
    const paddedNum = String(currentCount).padStart(3, '0');
    const code = company.company_code || 'XX';

    const docNumber = `IG-${code}-${prefix}-${paddedNum}`;

    // Increment the counter
    await supabase
      .from('companies')
      .update({ [counterField]: currentCount })
      .eq('id', companyId);

    return {
      docNumber,
      revision: getCurrentRevision(),
      reviewDate: getNextReviewDate(),
    };
  } catch (err) {
    console.error('Error generating doc number:', err);
    // Fallback: timestamp-based
    const ts = Date.now().toString().slice(-6);
    return {
      docNumber: `IG-XX-${TYPE_MAP[entityType] || 'DOC'}-${ts}`,
      revision: getCurrentRevision(),
      reviewDate: getNextReviewDate(),
    };
  }
};

/**
 * Revision number logic:
 * Rev 01 = initial release
 * Increments every year on 31 January SAST
 * So if created in 2026, it's Rev 01
 * After 31 Jan 2027, it becomes Rev 02
 * After 31 Jan 2028, Rev 03, etc.
 */
export const getCurrentRevision = (createdDate = null) => {
  const now = new Date();
  const created = createdDate ? new Date(createdDate) : now;
  
  // Base year is the year the document was created
  const baseYear = created.getFullYear();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  
  // Has 31 January of current year passed?
  const janPassed = currentMonth > 0 || (currentMonth === 0 && currentDay >= 31);
  
  let revNumber = 1;
  if (currentYear > baseYear) {
    revNumber = currentYear - baseYear;
    if (janPassed) revNumber += 1;
  }
  
  // Cap at Rev 01 minimum
  revNumber = Math.max(1, revNumber);
  
  return `Rev ${String(revNumber).padStart(2, '0')}`;
};

/**
 * Next review date is always 31 January of the next year
 */
export const getNextReviewDate = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  // If we haven't passed 31 Jan this year, review is 31 Jan this year
  // If we have, review is 31 Jan next year
  const janPassed = currentMonth > 0 || (currentMonth === 0 && currentDay >= 31);
  const reviewYear = janPassed ? currentYear + 1 : currentYear;
  
  return `31 January ${reviewYear}`;
};

/**
 * Format a document control block for display
 */
export const formatDocControl = (docNumber, revision, reviewDate) => {
  return {
    docNumber: docNumber || 'Unassigned',
    revision: revision || getCurrentRevision(),
    reviewDate: reviewDate || getNextReviewDate(),
    display: `${docNumber || 'Unassigned'} | ${revision || getCurrentRevision()} | Review: ${reviewDate || getNextReviewDate()}`,
  };
};
