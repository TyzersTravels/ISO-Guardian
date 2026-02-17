import { supabase } from './supabase';

export const logActivity = async ({ companyId, userId, action, entityType, entityId, changes }) => {
  try {
    await supabase.from('audit_log').insert({
      company_id: companyId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes || {},
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};
