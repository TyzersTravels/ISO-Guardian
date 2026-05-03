


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role_type" AS ENUM (
    'Super_Admin',
    'Reseller',
    'Admin',
    'SHEQ_Rep',
    'Quality_Rep',
    'Auditor'
);


ALTER TYPE "public"."user_role_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_clause_compliance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.requirements_total > 0 THEN
    NEW.compliance_percentage = (
      (NEW.requirements_met * 1.0 + NEW.requirements_partial * 0.5) / NEW.requirements_total * 100
    )::DECIMAL(5,2);
  ELSE
    NEW.compliance_percentage = 0.00;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_clause_compliance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_document_for_ncr"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_clause_name TEXT;
    v_user_email TEXT;
    v_clause_num INT;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.raised_by;
    
    -- Get clause number (try different column names)
    v_clause_num := COALESCE(NEW.clause_number, NEW.clause, 0);
    
    -- Set clause name
    v_clause_name := COALESCE(NEW.clause_name, 'Clause ' || v_clause_num::TEXT);
    
    -- Insert into documents (only if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE name = 'NCR-' || NEW.ncr_number || ': ' || NEW.title
        AND type = 'NCR'
    ) THEN
        INSERT INTO documents (
            name,
            type,
            standard,
            clause,
            clause_name,
            company_id,
            created_by,
            uploaded_by,
            status,
            approval_status,
            version,
            description,
            date_created,
            archived,
            permanently_deleted
        )
        VALUES (
            'NCR-' || NEW.ncr_number || ': ' || NEW.title,
            'NCR',
            NEW.standard,
            v_clause_num,
            v_clause_name,
            NEW.company_id,
            NEW.raised_by,
            COALESCE(v_user_email, 'unknown'),
            NEW.status,
            'Approved',
            '1.0',
            NEW.description,
            NEW.date_raised,
            FALSE,
            FALSE
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create document for NCR: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_document_for_ncr"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'IG-INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_company_id_text"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT company_id::text FROM public.users WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_company_id_text"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_subscription_status"("p_company_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', s.id,
    'tier', s.tier,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'grace_period_end', s.grace_period_end,
    'next_billing_date', s.next_billing_date,
    'max_users', s.max_users,
    'storage_limit', s.storage_limit,
    'is_active', CASE
      WHEN s.status = 'active' THEN true
      WHEN s.status = 'trial' AND s.trial_ends_at > now() THEN true
      WHEN s.status = 'past_due' AND s.grace_period_end > now() THEN true
      ELSE false
    END,
    'days_remaining', CASE
      WHEN s.status = 'trial' THEN GREATEST(0, EXTRACT(DAY FROM s.trial_ends_at - now()))
      WHEN s.status = 'past_due' THEN GREATEST(0, EXTRACT(DAY FROM s.grace_period_end - now()))
      ELSE null
    END
  ) INTO result
  FROM subscriptions s
  WHERE s.company_id = p_company_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(result, jsonb_build_object(
    'status', 'none',
    'is_active', false,
    'tier', null
  ));
END;
$$;


ALTER FUNCTION "public"."get_subscription_status"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_company_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_user_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_reseller_for_text"("target_company_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reseller_clients rc
    JOIN public.resellers r ON r.id = rc.reseller_id
    JOIN public.users u ON u.email = r.contact_email
    WHERE u.id = auth.uid() 
    AND rc.client_company_id = target_company_id
  )
$$;


ALTER FUNCTION "public"."is_reseller_for_text"("target_company_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_reseller_for_uuid"("target_company_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reseller_clients rc
    JOIN public.resellers r ON r.id = rc.reseller_id
    JOIN public.users u ON u.email = r.contact_email
    WHERE u.id = auth.uid() 
    AND rc.client_company_id = target_company_id::text
  )
$$;


ALTER FUNCTION "public"."is_reseller_for_uuid"("target_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_audit_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_counter INTEGER;
  v_year TEXT;
BEGIN
  UPDATE public.companies
  SET audit_counter = audit_counter + 1
  WHERE id = p_company_id
  RETURNING audit_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  RETURN 'AUD-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;


ALTER FUNCTION "public"."next_audit_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_doc_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_counter INTEGER;
  v_code TEXT;
BEGIN
  UPDATE public.companies
  SET doc_counter = doc_counter + 1
  WHERE id = p_company_id
  RETURNING doc_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  SELECT company_code INTO v_code FROM public.companies WHERE id = p_company_id;
  v_code := COALESCE(v_code, 'XX');

  RETURN 'IG-' || v_code || '-DOC-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;


ALTER FUNCTION "public"."next_doc_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_ncr_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_counter INTEGER;
  v_year TEXT;
BEGIN
  -- Atomically increment and return the new counter value
  UPDATE public.companies
  SET ncr_counter = ncr_counter + 1
  WHERE id = p_company_id
  RETURNING ncr_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  RETURN 'NCR-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;


ALTER FUNCTION "public"."next_ncr_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_review_number"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_counter INTEGER;
  v_code TEXT;
BEGIN
  UPDATE public.companies
  SET review_counter = review_counter + 1
  WHERE id = p_company_id
  RETURNING review_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  SELECT company_code INTO v_code FROM public.companies WHERE id = p_company_id;
  v_code := COALESCE(v_code, 'XX');

  RETURN 'IG-' || v_code || '-MR-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;


ALTER FUNCTION "public"."next_review_number"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_client_compliance"("client_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  iso_9001_avg DECIMAL(5,2);
  iso_14001_avg DECIMAL(5,2);
  iso_45001_avg DECIMAL(5,2);
  overall_avg DECIMAL(5,2);
BEGIN
  -- Calculate average for each standard
  SELECT COALESCE(AVG(compliance_percentage), 0.00) INTO iso_9001_avg
  FROM clauses WHERE client_id = client_uuid AND standard_code = 'ISO_9001';
  
  SELECT COALESCE(AVG(compliance_percentage), 0.00) INTO iso_14001_avg
  FROM clauses WHERE client_id = client_uuid AND standard_code = 'ISO_14001';
  
  SELECT COALESCE(AVG(compliance_percentage), 0.00) INTO iso_45001_avg
  FROM clauses WHERE client_id = client_uuid AND standard_code = 'ISO_45001';
  
  -- Calculate overall average
  overall_avg = (iso_9001_avg + iso_14001_avg + iso_45001_avg) / 3;
  
  -- Update client record
  UPDATE clients SET
    iso_9001_compliance = iso_9001_avg,
    iso_14001_compliance = iso_14001_avg,
    iso_45001_compliance = iso_45001_avg,
    overall_ims_compliance = overall_avg
  WHERE id = client_uuid;
END;
$$;


ALTER FUNCTION "public"."recalculate_client_compliance"("client_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_compliance_requirements"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- ISO 9001:2015
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_9001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the QMS.', 'Not Met'),
    (NEW.id, 'ISO_9001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the QMS.', 'Not Met'),
    (NEW.id, 'ISO_9001', 6, 'Planning', 'Plan actions to address risks and opportunities, quality objectives, and changes.', 'Not Met'),
    (NEW.id, 'ISO_9001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_9001', 8, 'Operation', 'Plan and control operational processes, requirements, design, external provision, production, and release.', 'Not Met'),
    (NEW.id, 'ISO_9001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate, conduct internal audits and management reviews.', 'Not Met'),
    (NEW.id, 'ISO_9001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Not Met');

  -- ISO 14001:2015
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_14001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the EMS.', 'Not Met'),
    (NEW.id, 'ISO_14001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the EMS.', 'Not Met'),
    (NEW.id, 'ISO_14001', 6, 'Planning', 'Plan actions to address environmental aspects, compliance obligations, risks and opportunities.', 'Not Met'),
    (NEW.id, 'ISO_14001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_14001', 8, 'Operation', 'Establish operational controls, emergency preparedness and response procedures.', 'Not Met'),
    (NEW.id, 'ISO_14001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate environmental performance, conduct audits and reviews.', 'Not Met'),
    (NEW.id, 'ISO_14001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Not Met');

  -- ISO 45001:2018
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_45001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the OH&S MS.', 'Not Met'),
    (NEW.id, 'ISO_45001', 5, 'Leadership and Worker Participation', 'Top management shall demonstrate leadership and ensure worker consultation and participation.', 'Not Met'),
    (NEW.id, 'ISO_45001', 6, 'Planning', 'Plan actions to address hazards, OH&S risks, legal requirements, and objectives.', 'Not Met'),
    (NEW.id, 'ISO_45001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_45001', 8, 'Operation', 'Establish operational controls, eliminate hazards, manage change, procurement, and emergency preparedness.', 'Not Met'),
    (NEW.id, 'ISO_45001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate OH&S performance, conduct audits and reviews.', 'Not Met'),
    (NEW.id, 'ISO_45001', 10, 'Improvement', 'Determine opportunities for improvement, investigate incidents, address nonconformities.', 'Not Met');

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."seed_compliance_requirements"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_user_permissions"("p_user_id" "uuid", "p_role" "public"."user_role_type") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete existing permissions
  DELETE FROM user_permissions WHERE user_id = p_user_id;
  
  -- Super Admin - Full access to everything
  IF p_role = 'Super_Admin' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, true, true, true, true),
    (p_user_id, 'ncrs', true, true, true, true, true),
    (p_user_id, 'audits', true, true, true, true, true),
    (p_user_id, 'compliance', true, true, true, false, false),
    (p_user_id, 'management_reviews', true, true, true, true, true),
    (p_user_id, 'analytics', true, false, false, false, false),
    (p_user_id, 'revenue_analytics', true, false, false, false, false),
    (p_user_id, 'users', true, true, true, true, false),
    (p_user_id, 'companies', true, true, true, true, false);
  
  -- Reseller/IMS Consultant - Client management, no revenue
  ELSIF p_role = 'Reseller' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, true, true, false, true),
    (p_user_id, 'ncrs', true, true, true, false, true),
    (p_user_id, 'audits', true, true, true, false, true),
    (p_user_id, 'compliance', true, true, true, false, false),
    (p_user_id, 'management_reviews', true, true, true, false, true),
    (p_user_id, 'client_analytics', true, false, false, false, false),
    (p_user_id, 'users', true, true, true, false, false),
    (p_user_id, 'companies', true, true, true, false, false);
  
  -- Admin/MD - Full company access, no analytics
  ELSIF p_role = 'Admin' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, true, true, true, true),
    (p_user_id, 'ncrs', true, true, true, true, true),
    (p_user_id, 'audits', true, true, true, true, true),
    (p_user_id, 'compliance', true, true, true, false, false),
    (p_user_id, 'management_reviews', true, true, true, true, true),
    (p_user_id, 'users', true, true, true, false, false);
  
  -- SHEQ Rep - Full access to all 3 standards
  ELSIF p_role = 'SHEQ_Rep' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, true, true, false, false),
    (p_user_id, 'ncrs', true, true, true, false, false),
    (p_user_id, 'audits', true, true, true, false, false),
    (p_user_id, 'compliance', true, true, true, false, false),
    (p_user_id, 'management_reviews', true, true, true, false, false);
  
  -- Quality Rep - Only ISO 9001 access
  ELSIF p_role = 'Quality_Rep' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, true, true, false, false),
    (p_user_id, 'ncrs', true, true, true, false, false),
    (p_user_id, 'audits', true, true, true, false, false),
    (p_user_id, 'compliance', true, true, true, false, false),
    (p_user_id, 'management_reviews', true, true, true, false, false);
    
    -- Update standards access to only ISO 9001
    UPDATE users SET standards_access = ARRAY['ISO_9001'] WHERE id = p_user_id;
  
  -- Auditor - Read only
  ELSIF p_role = 'Auditor' THEN
    INSERT INTO user_permissions (user_id, resource, can_view, can_create, can_edit, can_delete, can_archive) VALUES
    (p_user_id, 'documents', true, false, false, false, false),
    (p_user_id, 'ncrs', true, true, false, false, false), -- Can create findings
    (p_user_id, 'audits', true, true, false, false, false), -- Can create audit records
    (p_user_id, 'compliance', true, false, false, false, false),
    (p_user_id, 'management_reviews', true, false, false, false, false);
  END IF;
  
END;
$$;


ALTER FUNCTION "public"."seed_user_permissions"("p_user_id" "uuid", "p_role" "public"."user_role_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_ncr_archive_to_document"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE documents
    SET 
        archived = COALESCE(NEW.archived, FALSE),
        archived_at = NEW.archived_at,
        archived_by = NEW.archived_by,
        archive_reason = NEW.archive_reason,
        permanently_deleted = COALESCE(NEW.permanently_deleted, FALSE),
        permanently_deleted_at = NEW.permanently_deleted_at,
        permanently_deleted_by = NEW.permanently_deleted_by,
        deletion_reason = NEW.deletion_reason,
        status = NEW.status
    WHERE name LIKE 'NCR-' || NEW.ncr_number || ':%'
        AND type = 'NCR';
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to sync NCR archive: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_ncr_archive_to_document"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_cancellation_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_cancellation_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_erasure_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_erasure_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Track the event in usage_analytics
  INSERT INTO usage_analytics (
    company_id,
    user_id,
    event_type,
    event_details,
    timestamp
  ) VALUES (
    NEW.company_id,
    COALESCE(NEW.uploaded_by, NEW.assigned_to, NEW.created_by),
    TG_TABLE_NAME || '_' || TG_OP,
    to_jsonb(NEW),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_environmental_aspects_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_environmental_aspects_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_hazards_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_hazards_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_legal_requirements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_legal_requirements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_processes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_processes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscriptions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subscriptions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_template_instance_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_template_instance_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_owns_client"("client_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clients 
    WHERE id = client_uuid AND auth_user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."user_owns_client"("client_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New Conversation'::"text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_operations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "operation_type" "text" NOT NULL,
    "tokens_used" integer,
    "cost_usd" numeric(10,4),
    "reference_id" "uuid",
    "reference_type" "text",
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_operations_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['meeting_summary'::"text", 'meeting_agenda'::"text", 'document_draft'::"text", 'gap_analysis'::"text", 'recommendation'::"text"])))
);


ALTER TABLE "public"."ai_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "standard_code" "text" NOT NULL,
    "clause_number" integer,
    "clause_title" "text",
    "impact_category" "text" NOT NULL,
    "estimated_improvement_percentage" numeric(5,2),
    "effort_level" "text" NOT NULL,
    "priority" integer DEFAULT 5,
    "status" "text" DEFAULT 'Active'::"text",
    "action_items" "jsonb" DEFAULT '[]'::"jsonb",
    "assigned_to" "text",
    "due_date" "date",
    "completed_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_recommendations_clause_number_check" CHECK ((("clause_number" >= 4) AND ("clause_number" <= 10))),
    CONSTRAINT "ai_recommendations_effort_level_check" CHECK (("effort_level" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text"]))),
    CONSTRAINT "ai_recommendations_impact_category_check" CHECK (("impact_category" = ANY (ARRAY['Quick Win'::"text", 'High Impact'::"text", 'Medium Impact'::"text", 'Low Impact'::"text"]))),
    CONSTRAINT "ai_recommendations_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 10))),
    CONSTRAINT "ai_recommendations_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'In Progress'::"text", 'Completed'::"text", 'Dismissed'::"text"])))
);


ALTER TABLE "public"."ai_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "query_type" "text" DEFAULT 'chat'::"text" NOT NULL,
    "tokens_used" integer DEFAULT 0 NOT NULL,
    "model" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_checklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "audit_session_id" "uuid" NOT NULL,
    "audit_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "standard" "text" NOT NULL,
    "clause" "text" NOT NULL,
    "clause_title" "text" NOT NULL,
    "result" "text",
    "notes" "text",
    "evidence_refs" "jsonb" DEFAULT '[]'::"jsonb",
    "checked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_checklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "audit_session_id" "uuid" NOT NULL,
    "audit_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "clause" "text" NOT NULL,
    "standard" "text" NOT NULL,
    "finding_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "evidence" "text",
    "evidence_files" "jsonb" DEFAULT '[]'::"jsonb",
    "auditor_notes" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "evidence_photos" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."audit_findings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "changes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audit_log_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'updated'::"text", 'deleted'::"text", 'viewed'::"text", 'downloaded'::"text", 'approved'::"text", 'rejected'::"text", 'archived'::"text", 'restored'::"text", 'uploaded'::"text", 'status_changed'::"text", 'permanently_deleted'::"text", 'completed'::"text"]))),
    CONSTRAINT "audit_log_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['document'::"text", 'ncr'::"text", 'meeting'::"text", 'user'::"text", 'company'::"text", 'audit'::"text", 'management_review'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "audit_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "auditor_name" "text" NOT NULL,
    "auditor_email" "text" NOT NULL,
    "auditor_organisation" "text",
    "access_token" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."audit_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "audit_number" "text" NOT NULL,
    "audit_type" "text" NOT NULL,
    "standard" "text" NOT NULL,
    "audit_date" "date" NOT NULL,
    "audit_time" time without time zone,
    "assigned_auditor_id" "uuid",
    "assigned_auditor_name" "text",
    "status" "text" DEFAULT 'Planned'::"text",
    "scope" "text",
    "findings" "text",
    "observations" "text",
    "ncrs_raised" integer DEFAULT 0,
    "reminder_method" "text" DEFAULT 'email'::"text",
    "reminder_sent" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid",
    "assigned_to" "uuid",
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "archive_reason" "text",
    "deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    "deletion_reason" "text",
    "permanently_deleted" boolean DEFAULT false,
    "permanently_deleted_at" timestamp with time zone,
    "permanently_deleted_by" "text",
    "conclusion" "text",
    "evidence_reviewed" "text",
    "corrective_actions" "text",
    "auditor_recommendation" "text",
    CONSTRAINT "audits_audit_type_check" CHECK (("audit_type" = ANY (ARRAY['Internal'::"text", 'External'::"text", 'Surveillance'::"text", 'Certification'::"text"]))),
    CONSTRAINT "audits_reminder_method_check" CHECK (("reminder_method" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'both'::"text", 'none'::"text"]))),
    CONSTRAINT "audits_status_check" CHECK (("status" = ANY (ARRAY['Planned'::"text", 'In Progress'::"text", 'Complete'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."audits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cancellation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "subscription_status" "text",
    "tier" "text",
    "account_age_days" integer,
    "cooling_off_applies" boolean DEFAULT false NOT NULL,
    "within_initial_term" boolean DEFAULT false NOT NULL,
    "months_remaining" integer,
    "termination_fee_zar" numeric(10,2),
    "reason" "text",
    "acknowledgement_signed" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "processor_notes" "text",
    "effective_date" "date",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cancellation_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'withdrawn'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."cancellation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clauses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "standard_code" "text" NOT NULL,
    "clause_number" integer NOT NULL,
    "clause_title" "text" NOT NULL,
    "compliance_percentage" numeric(5,2) DEFAULT 0.00,
    "requirements_total" integer DEFAULT 0,
    "requirements_met" integer DEFAULT 0,
    "requirements_partial" integer DEFAULT 0,
    "requirements_not_met" integer DEFAULT 0,
    "documents_count" integer DEFAULT 0,
    "open_ncrs_count" integer DEFAULT 0,
    "last_audit_date" "date",
    "last_audit_score" numeric(5,2),
    "next_audit_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "clauses_clause_number_check" CHECK ((("clause_number" >= 4) AND ("clause_number" <= 10))),
    CONSTRAINT "clauses_compliance_percentage_check" CHECK ((("compliance_percentage" >= (0)::numeric) AND ("compliance_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."clauses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_health" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "health_score" integer DEFAULT 50,
    "last_login" timestamp with time zone,
    "logins_last_30_days" integer DEFAULT 0,
    "documents_uploaded_last_30_days" integer DEFAULT 0,
    "features_used_count" integer DEFAULT 0,
    "payment_status" "text",
    "days_since_last_payment" integer,
    "outstanding_balance" numeric(10,2) DEFAULT 0,
    "support_tickets_open" integer DEFAULT 0,
    "last_support_contact" timestamp with time zone,
    "churn_risk" "text",
    "churn_indicators" "jsonb",
    "calculated_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "company_name" "text" NOT NULL,
    "company_registration" "text",
    "industry" "text",
    "contact_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "contact_phone" "text",
    "information_officer_name" "text",
    "information_officer_email" "text",
    "privacy_policy_accepted" boolean DEFAULT false,
    "privacy_policy_version" "text",
    "privacy_policy_accepted_at" timestamp with time zone,
    "consent_marketing" boolean DEFAULT false,
    "data_retention_years" integer DEFAULT 7,
    "overall_ims_compliance" numeric(5,2) DEFAULT 0.00,
    "iso_9001_compliance" numeric(5,2) DEFAULT 0.00,
    "iso_14001_compliance" numeric(5,2) DEFAULT 0.00,
    "iso_45001_compliance" numeric(5,2) DEFAULT 0.00,
    "active_standards" "text"[] DEFAULT ARRAY['ISO_9001'::"text", 'ISO_14001'::"text", 'ISO_45001'::"text"],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "clients_iso_14001_compliance_check" CHECK ((("iso_14001_compliance" >= (0)::numeric) AND ("iso_14001_compliance" <= (100)::numeric))),
    CONSTRAINT "clients_iso_45001_compliance_check" CHECK ((("iso_45001_compliance" >= (0)::numeric) AND ("iso_45001_compliance" <= (100)::numeric))),
    CONSTRAINT "clients_iso_9001_compliance_check" CHECK ((("iso_9001_compliance" >= (0)::numeric) AND ("iso_9001_compliance" <= (100)::numeric))),
    CONSTRAINT "clients_overall_ims_compliance_check" CHECK ((("overall_ims_compliance" >= (0)::numeric) AND ("overall_ims_compliance" <= (100)::numeric)))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reseller_company_id" "uuid" NOT NULL,
    "client_company_id" "uuid" NOT NULL,
    "month" "date" NOT NULL,
    "client_mrr" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 25.00,
    "commission_amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "subscription_id" "uuid",
    "payment_id" "uuid",
    "amount" numeric(10,2),
    "percentage" numeric(5,2) DEFAULT 25.00,
    "period_start" "date",
    "period_end" "date",
    "payment_reference" "text",
    CONSTRAINT "commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."commissions" IS 'Tracks 25% MRR commission per Reseller Agreement Schedule A';



COMMENT ON COLUMN "public"."commissions"."status" IS 'pending | approved | paid';



COMMENT ON COLUMN "public"."commissions"."percentage" IS 'Reseller commission rate — default 25%';



COMMENT ON COLUMN "public"."commissions"."payment_reference" IS 'EFT payment reference when commission is marked as paid';



CREATE TABLE IF NOT EXISTS "public"."communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "communication_type" "text" NOT NULL,
    "description" "text",
    "what_communicated" "text" NOT NULL,
    "when_communicated" "date",
    "with_whom" "text" NOT NULL,
    "how_communicated" "text",
    "who_communicates" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text" DEFAULT '7.4'::"text",
    "frequency" "text",
    "is_recurring" boolean DEFAULT false,
    "is_legal_communication" boolean DEFAULT false,
    "regulatory_body" "text",
    "status" "text" DEFAULT 'Planned'::"text" NOT NULL,
    "evidence_url" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "communications_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['internal'::"text", 'external_incoming'::"text", 'external_outgoing'::"text"]))),
    CONSTRAINT "communications_frequency_check" CHECK (("frequency" = ANY (ARRAY['once'::"text", 'daily'::"text", 'weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'annually'::"text", 'as_needed'::"text"]))),
    CONSTRAINT "communications_status_check" CHECK (("status" = ANY (ARRAY['Planned'::"text", 'Completed'::"text", 'Overdue'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "registration_number" "text",
    "standards" "jsonb" DEFAULT '["ISO_9001"]'::"jsonb",
    "tier" "text" DEFAULT 'basic'::"text",
    "ai_operations_limit" integer DEFAULT 0,
    "ai_operations_used" integer DEFAULT 0,
    "ai_reset_date" "date",
    "settings" "jsonb" DEFAULT '{"single_standard_mode": false, "notifications_enabled": true}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reseller_id" "uuid",
    "standards_enabled" "text"[] DEFAULT ARRAY['ISO_9001'::"text"],
    "created_by" "uuid",
    "updated_by" "uuid",
    "company_code" "text",
    "doc_counter" integer DEFAULT 0,
    "ncr_counter" integer DEFAULT 0,
    "audit_counter" integer DEFAULT 0,
    "review_counter" integer DEFAULT 0,
    "logo_url" "text",
    "key_personnel" "jsonb" DEFAULT '{}'::"jsonb",
    "products_services" "text" DEFAULT ''::"text",
    "qms_scope" "text" DEFAULT ''::"text",
    "quality_policy" "text" DEFAULT ''::"text",
    "risk_counter" integer DEFAULT 0,
    "objective_counter" integer DEFAULT 0,
    "training_counter" integer DEFAULT 0,
    "improvement_counter" integer DEFAULT 0,
    "address" "text",
    "contact_phone" "text",
    "contact_email" "text",
    CONSTRAINT "companies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "companies_tier_check" CHECK (("tier" = ANY (ARRAY['basic'::"text", 'professional'::"text", 'enterprise'::"text", 'reseller'::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."companies"."reseller_id" IS 'Links client companies to their reseller. NULL = direct customer or reseller themselves';



COMMENT ON COLUMN "public"."companies"."key_personnel" IS 'Key personnel for ISO documentation (JSONB).';



COMMENT ON COLUMN "public"."companies"."products_services" IS 'Description of core products/services for QMS documentation.';



COMMENT ON COLUMN "public"."companies"."qms_scope" IS 'QMS scope statement for ISO documentation.';



COMMENT ON COLUMN "public"."companies"."quality_policy" IS 'Company quality policy statement for ISO documentation.';



CREATE TABLE IF NOT EXISTS "public"."compliance_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "report_name" "text" NOT NULL,
    "report_type" "text" NOT NULL,
    "standards_included" "text"[] NOT NULL,
    "report_period_start" "date" NOT NULL,
    "report_period_end" "date" NOT NULL,
    "file_url" "text",
    "generated_by" "text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "report_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "compliance_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['Monthly'::"text", 'Quarterly'::"text", 'Annual'::"text", 'Audit'::"text", 'Management Review'::"text", 'Custom'::"text"])))
);


ALTER TABLE "public"."compliance_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "standard" character varying(50) NOT NULL,
    "clause_number" integer NOT NULL,
    "clause_name" character varying(255) NOT NULL,
    "requirement_text" "text",
    "compliance_status" character varying(50) DEFAULT 'Not Met'::character varying,
    "evidence_document_id" "uuid",
    "notes" "text",
    "last_reviewed" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."compliance_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company" "text" NOT NULL,
    "standard" "text" DEFAULT 'ISO 9001'::"text" NOT NULL,
    "preferred_date" "date",
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consultation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "feedback_type" "text" NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_contact" "text",
    "source" "text",
    "reference_number" "text",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "product_service" "text",
    "date_received" "date" NOT NULL,
    "severity" "text",
    "assigned_to" "uuid",
    "root_cause" "text",
    "corrective_action" "text",
    "date_resolved" "date",
    "resolution_notes" "text",
    "linked_ncr_id" "uuid",
    "satisfaction_score" integer,
    "nps_score" integer,
    "status" "text" DEFAULT 'Open'::"text" NOT NULL,
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text" DEFAULT '9.1.2'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customer_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['complaint'::"text", 'compliment'::"text", 'suggestion'::"text", 'survey'::"text", 'return'::"text", 'warranty_claim'::"text", 'other'::"text"]))),
    CONSTRAINT "customer_feedback_nps_score_check" CHECK ((("nps_score" >= 0) AND ("nps_score" <= 10))),
    CONSTRAINT "customer_feedback_satisfaction_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 10))),
    CONSTRAINT "customer_feedback_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "customer_feedback_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'In Progress'::"text", 'Resolved'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."customer_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deletion_audit_trail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "text",
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "deleted_by" "uuid",
    "deleted_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text"
);


ALTER TABLE "public"."deletion_audit_trail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_acknowledgements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "company_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "version_acknowledged" "text" NOT NULL,
    "acknowledged_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_acknowledgements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "reviewed_by" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "comments" "text",
    "reviewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "company_id" "text" NOT NULL,
    "version_number" "text" NOT NULL,
    "file_path" "text",
    "file_size" bigint,
    "change_summary" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "standard" "text",
    "clause" integer,
    "clause_name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "version" "text" DEFAULT '1.0'::"text",
    "status" "text" DEFAULT 'Draft'::"text",
    "owner_id" "uuid",
    "created_by" "uuid",
    "approved_by" "uuid",
    "date_created" timestamp with time zone DEFAULT "now"(),
    "date_updated" timestamp with time zone DEFAULT "now"(),
    "date_approved" timestamp with time zone,
    "next_review_date" "date",
    "file_url" "text",
    "file_size" integer,
    "file_type" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_overdue" boolean DEFAULT false,
    "revision_history" "jsonb" DEFAULT '[]'::"jsonb",
    "search_vector" "tsvector",
    "file_path" "text",
    "uploaded_by" "text",
    "assigned_to" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "archive_reason" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    "deletion_reason" "text",
    "owner" "text",
    "deleted_by_email" "text",
    "permanently_deleted" boolean DEFAULT false,
    "permanently_deleted_at" timestamp with time zone,
    "permanently_deleted_by" "text",
    "approval_status" "text" DEFAULT 'Pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "version_history" "jsonb" DEFAULT '[]'::"jsonb",
    "document_number" "text",
    "review_frequency_months" integer DEFAULT 12,
    "last_reviewed_at" timestamp with time zone,
    "last_reviewed_by" "uuid",
    "superseded_by" "uuid",
    "supersedes" "uuid",
    "requires_acknowledgement" boolean DEFAULT false,
    "change_summary" "text",
    "source_type" "text",
    "source_id" "uuid",
    CONSTRAINT "documents_clause_check" CHECK ((("clause" >= 4) AND ("clause" <= 10))),
    CONSTRAINT "documents_type_check" CHECK (("type" = ANY (ARRAY['Policy'::"text", 'Procedure'::"text", 'Form'::"text", 'Manual'::"text", 'Record'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents_backup" (
    "id" "uuid",
    "company_id" "uuid",
    "name" "text",
    "description" "text",
    "standard" "text",
    "clause" integer,
    "clause_name" "text",
    "type" "text",
    "version" "text",
    "status" "text",
    "owner_id" "uuid",
    "created_by" "uuid",
    "approved_by" "uuid",
    "date_created" timestamp with time zone,
    "date_updated" timestamp with time zone,
    "date_approved" timestamp with time zone,
    "next_review_date" "date",
    "file_url" "text",
    "file_size" integer,
    "file_type" "text",
    "tags" "text"[],
    "is_overdue" boolean,
    "revision_history" "jsonb",
    "search_vector" "tsvector",
    "file_path" "text",
    "uploaded_by" "text",
    "assigned_to" "uuid",
    "uploaded_at" timestamp with time zone,
    "archived" boolean,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "archive_reason" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "deleted" boolean,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    "deletion_reason" "text"
);


ALTER TABLE "public"."documents_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drip_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "emails" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "drip_campaigns_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['post_assessment'::"text", 'post_consultation'::"text", 'trial_onboarding'::"text", 'reseller_outreach'::"text"])))
);


ALTER TABLE "public"."drip_campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."drip_campaigns" IS 'Email drip campaign definitions with embedded email sequence steps';



COMMENT ON COLUMN "public"."drip_campaigns"."emails" IS 'JSONB array of email steps: [{step, delay_days, subject, body, condition}]';



CREATE TABLE IF NOT EXISTS "public"."drip_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "recipient_name" "text",
    "step" integer DEFAULT 1 NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "personalization" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "drip_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'cancelled'::"text", 'unsubscribed'::"text"])))
);


ALTER TABLE "public"."drip_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."drip_queue" IS 'Individual scheduled email sends for drip campaigns';



COMMENT ON COLUMN "public"."drip_queue"."personalization" IS 'JSONB merge fields: score, standard, company_name, expiry_date, etc.';



CREATE TABLE IF NOT EXISTS "public"."drip_unsubscribes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" DEFAULT "encode"((("gen_random_uuid"())::"text")::"bytea", 'hex'::"text") NOT NULL,
    "is_unsubscribed" boolean DEFAULT false,
    "unsubscribed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drip_unsubscribes" OWNER TO "postgres";


COMMENT ON TABLE "public"."drip_unsubscribes" IS 'POPIA-compliant unsubscribe tracking for drip campaigns';



CREATE TABLE IF NOT EXISTS "public"."environmental_aspects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "activity" "text" NOT NULL,
    "aspect" "text" NOT NULL,
    "impact" "text" NOT NULL,
    "condition" "text" NOT NULL,
    "temporal" "text" DEFAULT 'current'::"text" NOT NULL,
    "aspect_type" "text" DEFAULT 'direct'::"text" NOT NULL,
    "impact_category" "text" NOT NULL,
    "impact_direction" "text" DEFAULT 'negative'::"text" NOT NULL,
    "severity" integer DEFAULT 1 NOT NULL,
    "probability" integer DEFAULT 1 NOT NULL,
    "frequency" integer DEFAULT 1 NOT NULL,
    "legal_factor" boolean DEFAULT false,
    "stakeholder_concern" boolean DEFAULT false,
    "significance_score" integer GENERATED ALWAYS AS (((("severity" * "probability") +
CASE
    WHEN "legal_factor" THEN 5
    ELSE 0
END) +
CASE
    WHEN "stakeholder_concern" THEN 3
    ELSE 0
END)) STORED,
    "is_significant" boolean DEFAULT false,
    "current_controls" "text",
    "planned_controls" "text",
    "responsible_person" "text",
    "target_date" "date",
    "standards" "text"[] DEFAULT '{ISO_14001}'::"text"[] NOT NULL,
    "clause_references" "text"[] DEFAULT '{6.1.2}'::"text"[],
    "linked_legal_id" "uuid",
    "linked_process_id" "uuid",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "last_reviewed" "date",
    "next_review_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "environmental_aspects_aspect_type_check" CHECK (("aspect_type" = ANY (ARRAY['direct'::"text", 'indirect'::"text"]))),
    CONSTRAINT "environmental_aspects_condition_check" CHECK (("condition" = ANY (ARRAY['normal'::"text", 'abnormal'::"text", 'emergency'::"text"]))),
    CONSTRAINT "environmental_aspects_frequency_check" CHECK ((("frequency" >= 1) AND ("frequency" <= 5))),
    CONSTRAINT "environmental_aspects_impact_category_check" CHECK (("impact_category" = ANY (ARRAY['air_emissions'::"text", 'water_discharge'::"text", 'land_contamination'::"text", 'waste_generation'::"text", 'resource_consumption'::"text", 'energy_use'::"text", 'noise_vibration'::"text", 'biodiversity'::"text", 'visual_impact'::"text", 'other'::"text"]))),
    CONSTRAINT "environmental_aspects_impact_direction_check" CHECK (("impact_direction" = ANY (ARRAY['positive'::"text", 'negative'::"text"]))),
    CONSTRAINT "environmental_aspects_probability_check" CHECK ((("probability" >= 1) AND ("probability" <= 5))),
    CONSTRAINT "environmental_aspects_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 5))),
    CONSTRAINT "environmental_aspects_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Under Review'::"text", 'Eliminated'::"text", 'Archived'::"text"]))),
    CONSTRAINT "environmental_aspects_temporal_check" CHECK (("temporal" = ANY (ARRAY['past'::"text", 'current'::"text", 'planned'::"text"])))
);


ALTER TABLE "public"."environmental_aspects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."erasure_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid",
    "user_email" "text" NOT NULL,
    "user_full_name" "text",
    "reason" "text",
    "acknowledgement_signed" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "processor_notes" "text",
    "retention_exceptions" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sla_deadline_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "erasure_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."erasure_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."failed_login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "ip_address" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."failed_login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hazards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "location_area" "text" NOT NULL,
    "activity" "text" NOT NULL,
    "hazard" "text" NOT NULL,
    "potential_harm" "text" NOT NULL,
    "who_at_risk" "text",
    "hazard_category" "text" NOT NULL,
    "routine" boolean DEFAULT true,
    "pre_likelihood" integer DEFAULT 1 NOT NULL,
    "pre_severity" integer DEFAULT 1 NOT NULL,
    "pre_risk_rating" integer GENERATED ALWAYS AS (("pre_likelihood" * "pre_severity")) STORED,
    "control_elimination" "text",
    "control_substitution" "text",
    "control_engineering" "text",
    "control_administrative" "text",
    "control_ppe" "text",
    "post_likelihood" integer DEFAULT 1,
    "post_severity" integer DEFAULT 1,
    "post_risk_rating" integer GENERATED ALWAYS AS (("post_likelihood" * "post_severity")) STORED,
    "responsible_person" "text",
    "target_date" "date",
    "standards" "text"[] DEFAULT '{ISO_45001}'::"text"[] NOT NULL,
    "clause_references" "text"[] DEFAULT '{6.1.2}'::"text"[],
    "linked_legal_id" "uuid",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "last_reviewed" "date",
    "next_review_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hazards_hazard_category_check" CHECK (("hazard_category" = ANY (ARRAY['physical'::"text", 'chemical'::"text", 'biological'::"text", 'ergonomic'::"text", 'psychosocial'::"text", 'electrical'::"text", 'mechanical'::"text", 'fire'::"text", 'environmental'::"text", 'vehicular'::"text", 'working_at_height'::"text", 'confined_space'::"text", 'other'::"text"]))),
    CONSTRAINT "hazards_post_likelihood_check" CHECK ((("post_likelihood" >= 1) AND ("post_likelihood" <= 5))),
    CONSTRAINT "hazards_post_severity_check" CHECK ((("post_severity" >= 1) AND ("post_severity" <= 5))),
    CONSTRAINT "hazards_pre_likelihood_check" CHECK ((("pre_likelihood" >= 1) AND ("pre_likelihood" <= 5))),
    CONSTRAINT "hazards_pre_severity_check" CHECK ((("pre_severity" >= 1) AND ("pre_severity" <= 5))),
    CONSTRAINT "hazards_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Under Review'::"text", 'Eliminated'::"text", 'Archived'::"text"])))
);


ALTER TABLE "public"."hazards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."improvements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "improvement_number" "text",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "improvement_type" "text" NOT NULL,
    "source" "text",
    "source_reference" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text" DEFAULT '10.3'::"text",
    "expected_benefit" "text",
    "resources_required" "text",
    "responsible_person" "uuid",
    "target_date" "date",
    "priority" "text",
    "actions_taken" "text",
    "date_implemented" "date",
    "actual_benefit" "text",
    "effectiveness_review" "text",
    "effectiveness_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_date" "date",
    "status" "text" DEFAULT 'Identified'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "improvements_improvement_type_check" CHECK (("improvement_type" = ANY (ARRAY['process_improvement'::"text", 'corrective_action'::"text", 'preventive_action'::"text", 'innovation'::"text", 'cost_reduction'::"text", 'efficiency'::"text", 'safety_improvement'::"text", 'environmental_improvement'::"text", 'customer_driven'::"text", 'other'::"text"]))),
    CONSTRAINT "improvements_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "improvements_status_check" CHECK (("status" = ANY (ARRAY['Identified'::"text", 'Planned'::"text", 'In Progress'::"text", 'Implemented'::"text", 'Verified'::"text", 'Closed'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."improvements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interested_parties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "party_name" "text" NOT NULL,
    "party_type" "text" NOT NULL,
    "description" "text",
    "contact_info" "text",
    "needs_expectations" "text" NOT NULL,
    "relevance" "text",
    "obligations" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text" DEFAULT '4.2'::"text",
    "influence_level" "text",
    "engagement_strategy" "text",
    "last_reviewed" "date",
    "review_notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interested_parties_influence_level_check" CHECK (("influence_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "interested_parties_party_type_check" CHECK (("party_type" = ANY (ARRAY['customer'::"text", 'supplier'::"text", 'employee'::"text", 'regulator'::"text", 'shareholder'::"text", 'community'::"text", 'contractor'::"text", 'union'::"text", 'insurance'::"text", 'neighbour'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."interested_parties" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoice_number_seq"
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "company_id" "uuid",
    "subscription_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "vat" numeric(10,2) GENERATED ALWAYS AS (("amount" * 0.15)) STORED,
    "total" numeric(10,2) GENERATED ALWAYS AS (("amount" * 1.15)) STORED,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invoice_date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "paid_date" "date",
    "payment_method" "text",
    "transaction_id" "text",
    "payment_proof_url" "text",
    "line_items" "jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iso_news_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "source_name" "text" NOT NULL,
    "source_url" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "ai_insight" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "image_url" "text",
    "published_at" timestamp with time zone,
    "fetched_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "slug" "text",
    "relevance_score" integer DEFAULT 50,
    "tokens_used" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "iso_news_articles_relevance_score_check" CHECK ((("relevance_score" >= 0) AND ("relevance_score" <= 100))),
    CONSTRAINT "iso_news_articles_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."iso_news_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iso_readiness_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "standard" "text" DEFAULT 'ISO 9001'::"text" NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."iso_readiness_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."iso_standards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "standard_code" "text" NOT NULL,
    "standard_name" "text" NOT NULL,
    "version" "text" NOT NULL,
    "description" "text",
    "color_hex" "text",
    "icon_name" "text",
    "total_clauses" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."iso_standards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "legislation_title" "text" NOT NULL,
    "legislation_number" "text",
    "section_reference" "text",
    "issuing_authority" "text",
    "requirement_type" "text" NOT NULL,
    "jurisdiction" "text" DEFAULT 'South Africa'::"text",
    "applicable_to" "text",
    "applicability_reason" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_references" "text"[] DEFAULT '{6.1.3}'::"text"[],
    "category" "text" NOT NULL,
    "compliance_status" "text" DEFAULT 'Compliant'::"text" NOT NULL,
    "compliance_evidence" "text",
    "last_compliance_evaluation" "date",
    "next_evaluation_date" "date",
    "evaluated_by" "text",
    "permit_number" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "renewal_reminder_days" integer DEFAULT 60,
    "last_amended" "date",
    "amendment_notes" "text",
    "responsible_person" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legal_requirements_category_check" CHECK (("category" = ANY (ARRAY['environmental'::"text", 'health_safety'::"text", 'quality'::"text", 'labour'::"text", 'fire_safety'::"text", 'hazardous_substances'::"text", 'waste_management'::"text", 'water'::"text", 'air_quality'::"text", 'noise'::"text", 'general'::"text", 'other'::"text"]))),
    CONSTRAINT "legal_requirements_compliance_status_check" CHECK (("compliance_status" = ANY (ARRAY['Compliant'::"text", 'Partially Compliant'::"text", 'Non-Compliant'::"text", 'Not Assessed'::"text", 'Not Applicable'::"text"]))),
    CONSTRAINT "legal_requirements_requirement_type_check" CHECK (("requirement_type" = ANY (ARRAY['act'::"text", 'regulation'::"text", 'bylaw'::"text", 'standard'::"text", 'code_of_practice'::"text", 'permit'::"text", 'licence'::"text", 'contract'::"text", 'industry_agreement'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."legal_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."management_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "review_number" "text" NOT NULL,
    "review_date" "date" NOT NULL,
    "review_time" time without time zone,
    "chairperson" "text",
    "attendees" "text",
    "agenda_items" "text",
    "minutes" "text",
    "compliance_snapshot" "text",
    "ncr_summary" "text",
    "audit_summary" "text",
    "decisions_made" "text",
    "action_items" "text",
    "resource_decisions" "text",
    "improvement_opportunities" "text",
    "next_review_date" "date",
    "minutes_document" "text",
    "supporting_documents" "text",
    "status" "text" DEFAULT 'Scheduled'::"text",
    "reminder_method" "text" DEFAULT 'email'::"text",
    "reminder_sent" boolean DEFAULT false,
    "created_by" "uuid",
    "completed_by" "uuid",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "archive_reason" "text",
    CONSTRAINT "management_reviews_reminder_method_check" CHECK (("reminder_method" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'both'::"text", 'none'::"text"]))),
    CONSTRAINT "management_reviews_status_check" CHECK (("status" = ANY (ARRAY['Scheduled'::"text", 'In Progress'::"text", 'Completed'::"text", 'Complete'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."management_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_attendees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "meeting_id" "uuid",
    "user_id" "uuid",
    "invited" boolean DEFAULT true,
    "attended" boolean DEFAULT false,
    "check_in_time" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meeting_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "standard" "text",
    "clause" integer,
    "meeting_type" "text",
    "scheduled_date" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "location" "text",
    "status" "text" DEFAULT 'Scheduled'::"text",
    "agenda" "text",
    "minutes" "text",
    "ai_summary" "text",
    "ai_action_items" "jsonb",
    "organizer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "meetings_clause_check" CHECK ((("clause" >= 4) AND ("clause" <= 10))),
    CONSTRAINT "meetings_meeting_type_check" CHECK (("meeting_type" = ANY (ARRAY['Management Review'::"text", 'Internal Audit'::"text", 'SHEQ Meeting'::"text", 'Training'::"text", 'Other'::"text"]))),
    CONSTRAINT "meetings_status_check" CHECK (("status" = ANY (ARRAY['Scheduled'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ncrs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "ncr_number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "standard" "text" NOT NULL,
    "clause" integer,
    "clause_name" "text",
    "severity" "text" NOT NULL,
    "status" "text" DEFAULT 'Open'::"text",
    "root_cause" "text",
    "corrective_action" "text",
    "preventive_action" "text",
    "assigned_to" "text",
    "assigned_by" "text",
    "date_opened" "date" DEFAULT CURRENT_DATE,
    "date_closed" "date",
    "due_date" "date",
    "closure_notes" "text",
    "closure_evidence" "jsonb",
    "verified_by" "uuid",
    "verification_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "uploaded_by" "uuid",
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "archive_reason" "text",
    "created_by" "text",
    "updated_by" "text",
    "closed_by" "text",
    "deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "text",
    "deletion_reason" "text",
    "permanently_deleted" boolean DEFAULT false,
    "permanently_deleted_at" timestamp with time zone,
    "permanently_deleted_by" "text",
    "is_archived" boolean DEFAULT false,
    "closed_date" "date",
    CONSTRAINT "ncrs_clause_check" CHECK ((("clause" >= 4) AND ("clause" <= 10))),
    CONSTRAINT "ncrs_severity_check" CHECK (("severity" = ANY (ARRAY['Critical'::"text", 'Major'::"text", 'Minor'::"text"]))),
    CONSTRAINT "ncrs_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'In Progress'::"text", 'Closed'::"text", 'Verified'::"text"])))
);


ALTER TABLE "public"."ncrs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_fetch_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "source_name" "text",
    "status" "text" DEFAULT 'success'::"text" NOT NULL,
    "articles_found" integer DEFAULT 0,
    "articles_new" integer DEFAULT 0,
    "articles_skipped" integer DEFAULT 0,
    "error_message" "text",
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "news_fetch_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'partial'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."news_fetch_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "source_type" "text" DEFAULT 'rss'::"text" NOT NULL,
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_fetched_at" timestamp with time zone,
    "fetch_interval_hours" integer DEFAULT 24,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "news_sources_source_type_check" CHECK (("source_type" = ANY (ARRAY['rss'::"text", 'html_scrape'::"text", 'api'::"text"])))
);


ALTER TABLE "public"."news_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "standards" "text"[] DEFAULT '{"ISO 9001"}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true,
    "unsubscribe_token" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "user_email" "text" NOT NULL,
    "notification_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "sent_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."objective_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "objective_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "recorded_value" numeric NOT NULL,
    "notes" "text",
    "recorded_by" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."objective_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "payfast_payment_id" "text",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "status" "text" DEFAULT 'complete'::"text" NOT NULL,
    "payment_method" "text" DEFAULT 'payfast'::"text",
    "billing_email" "text",
    "description" "text",
    "raw_itn" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid",
    "company_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "payment_method" "text" NOT NULL,
    "crypto_currency" "text",
    "crypto_amount" numeric(18,8),
    "crypto_address" "text",
    "crypto_transaction_hash" "text",
    "crypto_usd_rate" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transaction_id" "text",
    "payment_date" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "process_name" "text" NOT NULL,
    "process_code" "text",
    "process_owner" "uuid",
    "process_owner_name" "text",
    "department" "text",
    "process_type" "text" NOT NULL,
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_references" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "purpose" "text",
    "scope" "text",
    "inputs" "text",
    "outputs" "text",
    "activities" "text",
    "sequence_order" integer DEFAULT 0,
    "upstream_processes" "uuid"[] DEFAULT '{}'::"uuid"[],
    "downstream_processes" "uuid"[] DEFAULT '{}'::"uuid"[],
    "resources" "text",
    "competency_requirements" "text",
    "risks_opportunities" "text",
    "kpis" "text",
    "performance_target" "text",
    "monitoring_method" "text",
    "monitoring_frequency" "text",
    "related_documents" "text",
    "related_procedures" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "effective_date" "date",
    "last_reviewed" "date",
    "next_review_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "processes_monitoring_frequency_check" CHECK (("monitoring_frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'biannually'::"text", 'annually'::"text"]))),
    CONSTRAINT "processes_process_type_check" CHECK (("process_type" = ANY (ARRAY['core'::"text", 'support'::"text", 'management'::"text"]))),
    CONSTRAINT "processes_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Under Review'::"text", 'Obsolete'::"text", 'Draft'::"text"])))
);


ALTER TABLE "public"."processes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quality_objectives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "objective_number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text",
    "relevant_policy" "text",
    "kpi_name" "text" NOT NULL,
    "kpi_unit" "text",
    "baseline_value" numeric,
    "target_value" numeric NOT NULL,
    "current_value" numeric,
    "action_plan" "text",
    "resources_required" "text",
    "responsible_person" "uuid",
    "target_date" "date",
    "evaluation_method" "text",
    "status" "text" DEFAULT 'Not Started'::"text" NOT NULL,
    "progress_percentage" integer DEFAULT 0,
    "last_reviewed" "date",
    "review_frequency" "text" DEFAULT 'quarterly'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quality_objectives_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "quality_objectives_review_frequency_check" CHECK (("review_frequency" = ANY (ARRAY['monthly'::"text", 'quarterly'::"text", 'biannually'::"text", 'annually'::"text"]))),
    CONSTRAINT "quality_objectives_status_check" CHECK (("status" = ANY (ARRAY['Not Started'::"text", 'In Progress'::"text", 'On Track'::"text", 'At Risk'::"text", 'Achieved'::"text", 'Not Achieved'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."quality_objectives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid",
    "referrer_code" "text" NOT NULL,
    "referred_email" "text",
    "referred_user_id" "uuid",
    "referral_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "credit_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "converted_at" timestamp with time zone,
    CONSTRAINT "referrals_referral_type_check" CHECK (("referral_type" = ANY (ARRAY['affiliate'::"text", 'partner'::"text"]))),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'signed_up'::"text", 'converted'::"text", 'credited'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reseller_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reseller_id" "uuid",
    "client_company_id" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "subscription_tier" "text" DEFAULT 'Starter'::"text",
    "mrr" numeric(10,2),
    "onboarded_date" "date" DEFAULT CURRENT_DATE,
    "status" "text" DEFAULT 'Active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reseller_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reseller_commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reseller_id" "uuid",
    "client_company_id" "text",
    "period_start" "date",
    "period_end" "date",
    "mrr_amount" numeric(10,2),
    "commission_amount" numeric(10,2),
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reseller_commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reseller_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reseller_company_id" "uuid" NOT NULL,
    "discount_start_date" "date" NOT NULL,
    "discount_end_date" "date",
    "client_count" integer DEFAULT 0,
    "milestone_reached" boolean DEFAULT false,
    "milestone_reached_at" timestamp with time zone,
    "converted_to_standard" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reseller_milestones" OWNER TO "postgres";


COMMENT ON TABLE "public"."reseller_milestones" IS 'Tracks 6-month/10-client milestone per Discount Addendum Section 3';



CREATE TABLE IF NOT EXISTS "public"."resellers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "text" NOT NULL,
    "reseller_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 0.25,
    "status" "text" DEFAULT 'Good Standing'::"text",
    "agreement_date" "date",
    "internal_discount" numeric(5,2) DEFAULT 0.50,
    "internal_users_count" integer DEFAULT 0,
    "milestone_10_clients_reached" boolean DEFAULT false,
    "milestone_reached_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resellers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."risks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "risk_number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "risk_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "source" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text",
    "environmental_aspect" "text",
    "environmental_impact" "text",
    "aspect_condition" "text",
    "hazard_type" "text",
    "hazard_source" "text",
    "who_affected" "text",
    "likelihood" integer,
    "severity" integer,
    "risk_rating" integer GENERATED ALWAYS AS (("likelihood" * "severity")) STORED,
    "residual_likelihood" integer,
    "residual_severity" integer,
    "residual_risk_rating" integer GENERATED ALWAYS AS (
CASE
    WHEN (("residual_likelihood" IS NOT NULL) AND ("residual_severity" IS NOT NULL)) THEN ("residual_likelihood" * "residual_severity")
    ELSE NULL::integer
END) STORED,
    "treatment_plan" "text",
    "treatment_type" "text",
    "controls" "text",
    "responsible_person" "uuid",
    "due_date" "date",
    "status" "text" DEFAULT 'Open'::"text" NOT NULL,
    "last_reviewed" "date",
    "next_review_date" "date",
    "review_notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "risks_aspect_condition_check" CHECK (("aspect_condition" = ANY (ARRAY['normal'::"text", 'abnormal'::"text", 'emergency'::"text"]))),
    CONSTRAINT "risks_category_check" CHECK (("category" = ANY (ARRAY['strategic'::"text", 'operational'::"text", 'compliance'::"text", 'financial'::"text", 'environmental'::"text", 'health_safety'::"text", 'quality'::"text", 'reputational'::"text", 'other'::"text"]))),
    CONSTRAINT "risks_likelihood_check" CHECK ((("likelihood" >= 1) AND ("likelihood" <= 5))),
    CONSTRAINT "risks_residual_likelihood_check" CHECK ((("residual_likelihood" >= 1) AND ("residual_likelihood" <= 5))),
    CONSTRAINT "risks_residual_severity_check" CHECK ((("residual_severity" >= 1) AND ("residual_severity" <= 5))),
    CONSTRAINT "risks_risk_type_check" CHECK (("risk_type" = ANY (ARRAY['risk'::"text", 'opportunity'::"text"]))),
    CONSTRAINT "risks_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 5))),
    CONSTRAINT "risks_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'In Treatment'::"text", 'Monitoring'::"text", 'Closed'::"text", 'Accepted'::"text"]))),
    CONSTRAINT "risks_treatment_type_check" CHECK (("treatment_type" = ANY (ARRAY['avoid'::"text", 'mitigate'::"text", 'transfer'::"text", 'accept'::"text", 'exploit'::"text", 'enhance'::"text", 'share'::"text"])))
);


ALTER TABLE "public"."risks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "company_id" "text",
    "resource_type" "text",
    "resource_id" "uuid",
    "ip_address" "inet",
    "success" boolean DEFAULT true,
    "event_timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "plan" "text" NOT NULL,
    "status" "text" DEFAULT 'trial'::"text" NOT NULL,
    "users_count" integer DEFAULT 1 NOT NULL,
    "price_per_user" numeric(10,2) DEFAULT 400.00 NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "current_period_start" "date" NOT NULL,
    "current_period_end" "date" NOT NULL,
    "trial_end_date" "date",
    "total_amount" numeric(10,2) GENERATED ALWAYS AS ((("users_count")::numeric * "price_per_user")) STORED,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "payfast_subscription_id" "text",
    "payfast_token" "text",
    "billing_email" "text",
    "payment_method" "text" DEFAULT 'payfast'::"text",
    "trial_ends_at" timestamp with time zone,
    "grace_period_end" timestamp with time zone,
    "next_billing_date" "date",
    "referral_code" "text",
    "partner_code" "text"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Tracks subscription tiers per Schedule B + Partner Admin discount';



COMMENT ON COLUMN "public"."subscriptions"."status" IS 'trial | active | past_due | cancelled | expired | pending';



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "supplier_name" "text" NOT NULL,
    "supplier_code" "text",
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "website" "text",
    "supplier_type" "text" NOT NULL,
    "products_services" "text",
    "is_critical" boolean DEFAULT false,
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text" DEFAULT '8.4'::"text",
    "environmental_criteria" "text",
    "environmental_risk" "text",
    "ohs_requirements" "text",
    "ohs_risk" "text",
    "approval_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "approval_date" "date",
    "approved_by" "uuid",
    "evaluation_score" numeric,
    "evaluation_method" "text",
    "evaluation_criteria" "text",
    "last_evaluated" "date",
    "next_evaluation_date" "date",
    "evaluation_frequency" "text",
    "evaluation_notes" "text",
    "bbeee_level" "text",
    "bbeee_certificate_url" "text",
    "iso_certified" boolean DEFAULT false,
    "iso_certificate_details" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "blacklist_reason" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "suppliers_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Conditional'::"text", 'Suspended'::"text", 'Rejected'::"text"]))),
    CONSTRAINT "suppliers_environmental_risk_check" CHECK (("environmental_risk" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "suppliers_evaluation_frequency_check" CHECK (("evaluation_frequency" = ANY (ARRAY['quarterly'::"text", 'biannually'::"text", 'annually'::"text", 'biennial'::"text"]))),
    CONSTRAINT "suppliers_ohs_risk_check" CHECK (("ohs_risk" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "suppliers_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Inactive'::"text", 'Blacklisted'::"text"]))),
    CONSTRAINT "suppliers_supplier_type_check" CHECK (("supplier_type" = ANY (ARRAY['product'::"text", 'service'::"text", 'contractor'::"text", 'consultant'::"text", 'outsourced_process'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_date" "date" NOT NULL,
    "mrr" numeric(10,2) DEFAULT 0,
    "arr" numeric(10,2) DEFAULT 0,
    "total_clients" integer DEFAULT 0,
    "active_clients" integer DEFAULT 0,
    "trial_clients" integer DEFAULT 0,
    "churned_clients" integer DEFAULT 0,
    "new_clients" integer DEFAULT 0,
    "total_users" integer DEFAULT 0,
    "active_users" integer DEFAULT 0,
    "documents_uploaded" integer DEFAULT 0,
    "ncrs_created" integer DEFAULT 0,
    "audits_scheduled" integer DEFAULT 0,
    "exports_generated" integer DEFAULT 0,
    "storage_used_mb" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "job_title" "text",
    "department" "text",
    "role" "text" DEFAULT 'Employee'::"text" NOT NULL,
    "can_edit_compliance" boolean DEFAULT false,
    "can_manage_ncrs" boolean DEFAULT false,
    "can_upload_documents" boolean DEFAULT false,
    "can_view_reports" boolean DEFAULT false,
    "iso_9001_responsible" boolean DEFAULT false,
    "iso_14001_responsible" boolean DEFAULT false,
    "iso_45001_responsible" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "joined_at" timestamp with time zone,
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['Admin'::"text", 'Manager'::"text", 'Auditor'::"text", 'Employee'::"text", 'View Only'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_instance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instance_id" "uuid" NOT NULL,
    "section_index" integer NOT NULL,
    "previous_content" "jsonb",
    "new_content" "jsonb",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "change_type" "text" DEFAULT 'edit'::"text",
    CONSTRAINT "template_instance_history_change_type_check" CHECK (("change_type" = ANY (ARRAY['edit'::"text", 'approve'::"text", 'reject'::"text", 'revert'::"text"])))
);


ALTER TABLE "public"."template_instance_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_instances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "template_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "doc_number" "text",
    "content" "jsonb" DEFAULT '{"sections": []}'::"jsonb" NOT NULL,
    "standard" "text",
    "revision" "text" DEFAULT '01'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "completion_percent" integer DEFAULT 0,
    "total_sections" integer DEFAULT 0,
    "completed_sections" integer DEFAULT 0,
    "prepared_by" "uuid",
    "reviewed_by" "uuid",
    "approved_by" "uuid",
    "prepared_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "review_comments" "text",
    "approval_comments" "text",
    "version" integer DEFAULT 1,
    "parent_instance_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_autosave_at" timestamp with time zone,
    CONSTRAINT "template_instances_completion_percent_check" CHECK ((("completion_percent" >= 0) AND ("completion_percent" <= 100))),
    CONSTRAINT "template_instances_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'archived'::"text", 'superseded'::"text"])))
);


ALTER TABLE "public"."template_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "template_id" "text" NOT NULL,
    "price_paid_zar" integer DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'subscriber'::"text",
    "payment_reference" "text",
    "downloaded_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "amount" numeric(10,2),
    "currency" "text" DEFAULT 'ZAR'::"text",
    "payfast_payment_id" "text",
    "download_token" "uuid" DEFAULT "gen_random_uuid"(),
    "download_token_expires_at" timestamp with time zone DEFAULT ("now"() + '48:00:00'::interval),
    "downloaded" boolean DEFAULT false,
    "buyer_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."template_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "employee_name" "text" NOT NULL,
    "job_title" "text",
    "department" "text",
    "training_title" "text" NOT NULL,
    "training_type" "text" NOT NULL,
    "provider" "text",
    "competency_area" "text",
    "standards" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "clause_reference" "text",
    "is_safety_critical" boolean DEFAULT false,
    "legal_requirement" boolean DEFAULT false,
    "date_completed" "date",
    "expiry_date" "date",
    "next_refresher_date" "date",
    "certificate_url" "text",
    "certificate_number" "text",
    "competency_status" "text" DEFAULT 'Not Assessed'::"text" NOT NULL,
    "assessment_method" "text",
    "assessment_score" numeric,
    "assessor" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_records_competency_status_check" CHECK (("competency_status" = ANY (ARRAY['Not Assessed'::"text", 'Competent'::"text", 'Not Yet Competent'::"text", 'Expired'::"text", 'In Progress'::"text"]))),
    CONSTRAINT "training_records_training_type_check" CHECK (("training_type" = ANY (ARRAY['induction'::"text", 'on_the_job'::"text", 'formal_course'::"text", 'certification'::"text", 'awareness'::"text", 'drill'::"text", 'refresher'::"text", 'external'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."training_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_details" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "billable" boolean DEFAULT false,
    "cost" numeric(10,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usage_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "resource" character varying(50) NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_create" boolean DEFAULT false,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "can_archive" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "company_id" "uuid",
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text",
    "standards_access" "jsonb" DEFAULT '["ISO_9001"]'::"jsonb",
    "avatar_url" "text",
    "phone" "text",
    "last_login" timestamp with time zone,
    "login_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role_type" "public"."user_role_type" DEFAULT 'Admin'::"public"."user_role_type",
    "referral_code" "text",
    "referred_by" "text",
    "active_session_token" "text",
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'lead_auditor'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_client_engagement" WITH ("security_invoker"='true') AS
 SELECT "id" AS "company_id",
    "name" AS "company_name",
    "company_code",
    ( SELECT "count"(*) AS "count"
           FROM "public"."users" "u"
          WHERE (("u"."company_id")::"text" = ("c"."id")::"text")) AS "user_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."documents" "d"
          WHERE ("d"."company_id" = ("c"."id")::"text")) AS "document_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."ncrs" "n"
          WHERE (("n"."company_id")::"text" = ("c"."id")::"text")) AS "ncr_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."audits" "a"
          WHERE (("a"."company_id")::"text" = ("c"."id")::"text")) AS "audit_count",
    ( SELECT "max"("al"."created_at") AS "max"
           FROM "public"."audit_log" "al"
          WHERE (("al"."company_id")::"text" = ("c"."id")::"text")) AS "last_activity"
   FROM "public"."companies" "c";


ALTER VIEW "public"."v_client_engagement" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_mrr_by_client" WITH ("security_invoker"='true') AS
 SELECT "c"."id" AS "company_id",
    "c"."name" AS "company_name",
    "c"."company_code",
    "s"."status" AS "subscription_status",
    "s"."created_at" AS "subscription_start"
   FROM ("public"."companies" "c"
     JOIN "public"."subscriptions" "s" ON ((("s"."company_id")::"text" = ("c"."id")::"text")));


ALTER VIEW "public"."v_mrr_by_client" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_outstanding_invoices" WITH ("security_invoker"='true') AS
 SELECT "i"."id",
    "i"."invoice_number",
    "i"."company_id",
    "c"."name" AS "company_name",
    "i"."amount",
    "i"."vat",
    "i"."total",
    "i"."currency",
    "i"."status",
    "i"."invoice_date",
    "i"."due_date",
    "i"."paid_date"
   FROM ("public"."invoices" "i"
     LEFT JOIN "public"."companies" "c" ON ((("c"."id")::"text" = ("i"."company_id")::"text")))
  WHERE ("i"."status" = ANY (ARRAY['pending'::"text", 'overdue'::"text"]));


ALTER VIEW "public"."v_outstanding_invoices" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_operations"
    ADD CONSTRAINT "ai_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_checklist"
    ADD CONSTRAINT "audit_checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_findings"
    ADD CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_sessions"
    ADD CONSTRAINT "audit_sessions_access_token_key" UNIQUE ("access_token");



ALTER TABLE ONLY "public"."audit_sessions"
    ADD CONSTRAINT "audit_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clauses"
    ADD CONSTRAINT "clauses_client_id_standard_code_clause_number_key" UNIQUE ("client_id", "standard_code", "clause_number");



ALTER TABLE ONLY "public"."clauses"
    ADD CONSTRAINT "clauses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_health"
    ADD CONSTRAINT "client_health_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_contact_email_key" UNIQUE ("contact_email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_requirements"
    ADD CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultation_requests"
    ADD CONSTRAINT "consultation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_feedback"
    ADD CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deletion_audit_trail"
    ADD CONSTRAINT "deletion_audit_trail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_acknowledgements"
    ADD CONSTRAINT "document_acknowledgements_document_id_user_id_version_ackno_key" UNIQUE ("document_id", "user_id", "version_acknowledged");



ALTER TABLE ONLY "public"."document_acknowledgements"
    ADD CONSTRAINT "document_acknowledgements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_version_number_key" UNIQUE ("document_id", "version_number");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drip_campaigns"
    ADD CONSTRAINT "drip_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drip_campaigns"
    ADD CONSTRAINT "drip_campaigns_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."drip_queue"
    ADD CONSTRAINT "drip_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drip_unsubscribes"
    ADD CONSTRAINT "drip_unsubscribes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drip_unsubscribes"
    ADD CONSTRAINT "drip_unsubscribes_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."environmental_aspects"
    ADD CONSTRAINT "environmental_aspects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."erasure_requests"
    ADD CONSTRAINT "erasure_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."failed_login_attempts"
    ADD CONSTRAINT "failed_login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hazards"
    ADD CONSTRAINT "hazards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interested_parties"
    ADD CONSTRAINT "interested_parties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iso_news_articles"
    ADD CONSTRAINT "iso_news_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iso_news_articles"
    ADD CONSTRAINT "iso_news_articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."iso_readiness_assessments"
    ADD CONSTRAINT "iso_readiness_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iso_standards"
    ADD CONSTRAINT "iso_standards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."iso_standards"
    ADD CONSTRAINT "iso_standards_standard_code_key" UNIQUE ("standard_code");



ALTER TABLE ONLY "public"."legal_requirements"
    ADD CONSTRAINT "legal_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."management_reviews"
    ADD CONSTRAINT "management_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_meeting_id_user_id_key" UNIQUE ("meeting_id", "user_id");



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ncrs"
    ADD CONSTRAINT "ncrs_ncr_number_company_unique" UNIQUE ("ncr_number", "company_id");



ALTER TABLE ONLY "public"."ncrs"
    ADD CONSTRAINT "ncrs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_fetch_logs"
    ADD CONSTRAINT "news_fetch_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_sources"
    ADD CONSTRAINT "news_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_sources"
    ADD CONSTRAINT "news_sources_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."news_subscribers"
    ADD CONSTRAINT "news_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."news_subscribers"
    ADD CONSTRAINT "news_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."objective_progress"
    ADD CONSTRAINT "objective_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."processes"
    ADD CONSTRAINT "processes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quality_objectives"
    ADD CONSTRAINT "quality_objectives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reseller_clients"
    ADD CONSTRAINT "reseller_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reseller_commissions"
    ADD CONSTRAINT "reseller_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reseller_milestones"
    ADD CONSTRAINT "reseller_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resellers"
    ADD CONSTRAINT "resellers_company_id_key" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."resellers"
    ADD CONSTRAINT "resellers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."risks"
    ADD CONSTRAINT "risks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_payfast_subscription_id_key" UNIQUE ("payfast_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_metrics"
    ADD CONSTRAINT "system_metrics_metric_date_key" UNIQUE ("metric_date");



ALTER TABLE ONLY "public"."system_metrics"
    ADD CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_client_id_email_key" UNIQUE ("client_id", "email");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_instance_history"
    ADD CONSTRAINT "template_instance_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_purchases"
    ADD CONSTRAINT "template_purchases_download_token_key" UNIQUE ("download_token");



ALTER TABLE ONLY "public"."template_purchases"
    ADD CONSTRAINT "template_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_analytics"
    ADD CONSTRAINT "usage_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_company_id_role_key" UNIQUE ("user_id", "company_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referral_code_key" UNIQUE ("referral_code");



CREATE INDEX "idx_ai_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_ai_recommendations_client" ON "public"."ai_recommendations" USING "btree" ("client_id");



CREATE INDEX "idx_ai_recommendations_status" ON "public"."ai_recommendations" USING "btree" ("status");



CREATE INDEX "idx_ai_usage_company_month" ON "public"."ai_usage" USING "btree" ("company_id", "created_at");



CREATE INDEX "idx_ai_usage_daily" ON "public"."ai_usage" USING "btree" ("created_at");



CREATE INDEX "idx_audit_checklist_session" ON "public"."audit_checklist" USING "btree" ("audit_session_id", "standard", "clause");



CREATE INDEX "idx_audit_findings_audit" ON "public"."audit_findings" USING "btree" ("audit_id");



CREATE INDEX "idx_audit_findings_session" ON "public"."audit_findings" USING "btree" ("audit_session_id");



CREATE INDEX "idx_audit_log_company" ON "public"."audit_log" USING "btree" ("company_id");



CREATE INDEX "idx_audit_log_created" ON "public"."audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_audit_log_user" ON "public"."audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_client" ON "public"."audit_logs" USING "btree" ("client_id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_audit_sessions_audit" ON "public"."audit_sessions" USING "btree" ("audit_id");



CREATE INDEX "idx_audit_sessions_token" ON "public"."audit_sessions" USING "btree" ("access_token");



CREATE INDEX "idx_audits_assigned_to" ON "public"."audits" USING "btree" ("assigned_to");



CREATE INDEX "idx_audits_company_date" ON "public"."audits" USING "btree" ("company_id", "audit_date");



CREATE INDEX "idx_audits_status" ON "public"."audits" USING "btree" ("status");



CREATE INDEX "idx_audits_uploaded_by" ON "public"."audits" USING "btree" ("uploaded_by");



CREATE INDEX "idx_cancellation_requests_company" ON "public"."cancellation_requests" USING "btree" ("company_id", "requested_at" DESC);



CREATE INDEX "idx_cancellation_requests_requester" ON "public"."cancellation_requests" USING "btree" ("requested_by");



CREATE INDEX "idx_cancellation_requests_status" ON "public"."cancellation_requests" USING "btree" ("status", "requested_at" DESC);



CREATE INDEX "idx_clauses_client" ON "public"."clauses" USING "btree" ("client_id");



CREATE INDEX "idx_clauses_standard" ON "public"."clauses" USING "btree" ("standard_code");



CREATE INDEX "idx_clients_auth_user" ON "public"."clients" USING "btree" ("auth_user_id");



CREATE INDEX "idx_commissions_client" ON "public"."commissions" USING "btree" ("client_company_id");



CREATE INDEX "idx_commissions_month" ON "public"."commissions" USING "btree" ("month");



CREATE INDEX "idx_commissions_reseller" ON "public"."commissions" USING "btree" ("reseller_company_id");



CREATE INDEX "idx_commissions_status" ON "public"."commissions" USING "btree" ("status");



CREATE INDEX "idx_comms_company" ON "public"."communications" USING "btree" ("company_id");



CREATE INDEX "idx_comms_standards" ON "public"."communications" USING "gin" ("standards");



CREATE INDEX "idx_comms_status" ON "public"."communications" USING "btree" ("company_id", "status");



CREATE INDEX "idx_companies_reseller_id" ON "public"."companies" USING "btree" ("reseller_id");



CREATE INDEX "idx_compliance_company" ON "public"."compliance_requirements" USING "btree" ("company_id");



CREATE INDEX "idx_compliance_standard" ON "public"."compliance_requirements" USING "btree" ("standard");



CREATE INDEX "idx_compliance_status" ON "public"."compliance_requirements" USING "btree" ("compliance_status");



CREATE INDEX "idx_doc_ack_company_id" ON "public"."document_acknowledgements" USING "btree" ("company_id");



CREATE INDEX "idx_doc_ack_document_id" ON "public"."document_acknowledgements" USING "btree" ("document_id");



CREATE INDEX "idx_doc_ack_user_id" ON "public"."document_acknowledgements" USING "btree" ("user_id");



CREATE INDEX "idx_document_versions_company_id" ON "public"."document_versions" USING "btree" ("company_id");



CREATE INDEX "idx_document_versions_document_id" ON "public"."document_versions" USING "btree" ("document_id");



CREATE INDEX "idx_documents_assigned_to" ON "public"."documents" USING "btree" ("assigned_to");



CREATE INDEX "idx_documents_clause" ON "public"."documents" USING "btree" ("clause");



CREATE INDEX "idx_documents_company" ON "public"."documents" USING "btree" ("company_id");



CREATE INDEX "idx_documents_company_status" ON "public"."documents" USING "btree" ("company_id", "status");



CREATE INDEX "idx_documents_created_by" ON "public"."documents" USING "btree" ("created_by");



CREATE INDEX "idx_documents_next_review_date" ON "public"."documents" USING "btree" ("next_review_date") WHERE ("next_review_date" IS NOT NULL);



CREATE INDEX "idx_documents_owner_id" ON "public"."documents" USING "btree" ("owner_id");



CREATE INDEX "idx_documents_search" ON "public"."documents" USING "gin" ("search_vector");



CREATE INDEX "idx_documents_source" ON "public"."documents" USING "btree" ("source_type", "source_id") WHERE ("source_type" IS NOT NULL);



CREATE INDEX "idx_documents_standard" ON "public"."documents" USING "btree" ("standard");



CREATE INDEX "idx_documents_status" ON "public"."documents" USING "btree" ("status");



CREATE INDEX "idx_documents_uploaded_by" ON "public"."documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_drip_queue_pending" ON "public"."drip_queue" USING "btree" ("scheduled_at", "status") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_drip_queue_recipient" ON "public"."drip_queue" USING "btree" ("recipient_email", "status");



CREATE UNIQUE INDEX "idx_drip_queue_unique_enrollment" ON "public"."drip_queue" USING "btree" ("campaign_id", "recipient_email", "step");



CREATE UNIQUE INDEX "idx_drip_unsubscribes_email" ON "public"."drip_unsubscribes" USING "btree" ("email");



CREATE INDEX "idx_drip_unsubscribes_token" ON "public"."drip_unsubscribes" USING "btree" ("token");



CREATE INDEX "idx_env_aspects_category" ON "public"."environmental_aspects" USING "btree" ("impact_category");



CREATE INDEX "idx_env_aspects_company" ON "public"."environmental_aspects" USING "btree" ("company_id");



CREATE INDEX "idx_env_aspects_significant" ON "public"."environmental_aspects" USING "btree" ("is_significant");



CREATE INDEX "idx_erasure_requests_sla" ON "public"."erasure_requests" USING "btree" ("sla_deadline_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text"]));



CREATE INDEX "idx_erasure_requests_status" ON "public"."erasure_requests" USING "btree" ("status", "requested_at" DESC);



CREATE INDEX "idx_erasure_requests_user" ON "public"."erasure_requests" USING "btree" ("user_id", "requested_at" DESC);



CREATE INDEX "idx_failed_login_email_time" ON "public"."failed_login_attempts" USING "btree" ("email", "attempted_at" DESC);



CREATE INDEX "idx_failed_login_ip_time" ON "public"."failed_login_attempts" USING "btree" ("ip_address", "attempted_at" DESC);



CREATE INDEX "idx_feedback_company" ON "public"."customer_feedback" USING "btree" ("company_id");



CREATE INDEX "idx_feedback_status" ON "public"."customer_feedback" USING "btree" ("company_id", "status");



CREATE INDEX "idx_feedback_type" ON "public"."customer_feedback" USING "btree" ("company_id", "feedback_type");



CREATE INDEX "idx_hazards_category" ON "public"."hazards" USING "btree" ("hazard_category");



CREATE INDEX "idx_hazards_company" ON "public"."hazards" USING "btree" ("company_id");



CREATE INDEX "idx_hazards_status" ON "public"."hazards" USING "btree" ("status");



CREATE INDEX "idx_health_company" ON "public"."client_health" USING "btree" ("company_id");



CREATE INDEX "idx_health_risk" ON "public"."client_health" USING "btree" ("churn_risk");



CREATE INDEX "idx_health_score" ON "public"."client_health" USING "btree" ("health_score");



CREATE INDEX "idx_improvements_company" ON "public"."improvements" USING "btree" ("company_id");



CREATE INDEX "idx_improvements_standards" ON "public"."improvements" USING "gin" ("standards");



CREATE INDEX "idx_improvements_status" ON "public"."improvements" USING "btree" ("company_id", "status");



CREATE INDEX "idx_invoices_company" ON "public"."invoices" USING "btree" ("company_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_ip_company" ON "public"."interested_parties" USING "btree" ("company_id");



CREATE INDEX "idx_ip_standards" ON "public"."interested_parties" USING "gin" ("standards");



CREATE INDEX "idx_legal_requirements_category" ON "public"."legal_requirements" USING "btree" ("category");



CREATE INDEX "idx_legal_requirements_company" ON "public"."legal_requirements" USING "btree" ("company_id");



CREATE INDEX "idx_legal_requirements_expiry" ON "public"."legal_requirements" USING "btree" ("expiry_date");



CREATE INDEX "idx_legal_requirements_status" ON "public"."legal_requirements" USING "btree" ("compliance_status");



CREATE INDEX "idx_meetings_company" ON "public"."meetings" USING "btree" ("company_id");



CREATE INDEX "idx_meetings_date" ON "public"."meetings" USING "btree" ("scheduled_date");



CREATE INDEX "idx_meetings_status" ON "public"."meetings" USING "btree" ("status");



CREATE INDEX "idx_metrics_date" ON "public"."system_metrics" USING "btree" ("metric_date");



CREATE INDEX "idx_milestones_reseller" ON "public"."reseller_milestones" USING "btree" ("reseller_company_id");



CREATE INDEX "idx_ncrs_assigned_to" ON "public"."ncrs" USING "btree" ("assigned_to");



CREATE INDEX "idx_ncrs_closed_by" ON "public"."ncrs" USING "btree" ("closed_by");



CREATE INDEX "idx_ncrs_company" ON "public"."ncrs" USING "btree" ("company_id");



CREATE INDEX "idx_ncrs_created_by" ON "public"."ncrs" USING "btree" ("created_by");



CREATE INDEX "idx_ncrs_due_date" ON "public"."ncrs" USING "btree" ("due_date");



CREATE INDEX "idx_ncrs_status" ON "public"."ncrs" USING "btree" ("status");



CREATE INDEX "idx_ncrs_uploaded_by" ON "public"."ncrs" USING "btree" ("uploaded_by");



CREATE UNIQUE INDEX "idx_news_articles_source_url" ON "public"."iso_news_articles" USING "btree" ("source_url");



CREATE INDEX "idx_news_articles_standards" ON "public"."iso_news_articles" USING "gin" ("standards");



CREATE INDEX "idx_news_articles_status" ON "public"."iso_news_articles" USING "btree" ("status");



CREATE INDEX "idx_news_articles_status_published" ON "public"."iso_news_articles" USING "btree" ("published_at" DESC) WHERE ("status" = 'published'::"text");



CREATE INDEX "idx_notification_log_dedup" ON "public"."notification_log" USING "btree" ("company_id", "notification_type", "entity_type", "entity_id", "sent_at");



CREATE INDEX "idx_obj_progress_objective" ON "public"."objective_progress" USING "btree" ("objective_id");



CREATE INDEX "idx_objectives_company" ON "public"."quality_objectives" USING "btree" ("company_id");



CREATE INDEX "idx_objectives_standards" ON "public"."quality_objectives" USING "gin" ("standards");



CREATE INDEX "idx_objectives_status" ON "public"."quality_objectives" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payment_history_company" ON "public"."payment_history" USING "btree" ("company_id");



CREATE INDEX "idx_payment_history_payfast_id" ON "public"."payment_history" USING "btree" ("payfast_payment_id");



CREATE INDEX "idx_payments_company" ON "public"."payments" USING "btree" ("company_id");



CREATE INDEX "idx_payments_invoice" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_processes_company" ON "public"."processes" USING "btree" ("company_id");



CREATE INDEX "idx_processes_owner" ON "public"."processes" USING "btree" ("process_owner");



CREATE INDEX "idx_processes_status" ON "public"."processes" USING "btree" ("status");



CREATE INDEX "idx_processes_type" ON "public"."processes" USING "btree" ("process_type");



CREATE INDEX "idx_referrals_referrer_code" ON "public"."referrals" USING "btree" ("referrer_code");



CREATE INDEX "idx_referrals_referrer_id" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_reviews_company_date" ON "public"."management_reviews" USING "btree" ("company_id", "review_date");



CREATE INDEX "idx_reviews_status" ON "public"."management_reviews" USING "btree" ("status");



CREATE INDEX "idx_risks_company" ON "public"."risks" USING "btree" ("company_id");



CREATE INDEX "idx_risks_rating" ON "public"."risks" USING "btree" ("company_id", "risk_rating" DESC);



CREATE INDEX "idx_risks_standards" ON "public"."risks" USING "gin" ("standards");



CREATE INDEX "idx_risks_status" ON "public"."risks" USING "btree" ("company_id", "status");



CREATE INDEX "idx_subscriptions_company" ON "public"."subscriptions" USING "btree" ("company_id");



CREATE INDEX "idx_subscriptions_company_status" ON "public"."subscriptions" USING "btree" ("company_id", "status");



CREATE INDEX "idx_subscriptions_payfast_id" ON "public"."subscriptions" USING "btree" ("payfast_subscription_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_suppliers_company" ON "public"."suppliers" USING "btree" ("company_id");



CREATE INDEX "idx_suppliers_standards" ON "public"."suppliers" USING "gin" ("standards");



CREATE INDEX "idx_suppliers_status" ON "public"."suppliers" USING "btree" ("company_id", "status");



CREATE INDEX "idx_team_members_client" ON "public"."team_members" USING "btree" ("client_id");



CREATE INDEX "idx_team_members_email" ON "public"."team_members" USING "btree" ("email");



CREATE INDEX "idx_template_instance_history_instance" ON "public"."template_instance_history" USING "btree" ("instance_id");



CREATE INDEX "idx_template_instances_company" ON "public"."template_instances" USING "btree" ("company_id");



CREATE INDEX "idx_template_instances_created_by" ON "public"."template_instances" USING "btree" ("created_by");



CREATE INDEX "idx_template_instances_status" ON "public"."template_instances" USING "btree" ("status");



CREATE INDEX "idx_template_instances_template" ON "public"."template_instances" USING "btree" ("template_id");



CREATE INDEX "idx_template_purchases_company" ON "public"."template_purchases" USING "btree" ("company_id");



CREATE INDEX "idx_template_purchases_download_token" ON "public"."template_purchases" USING "btree" ("download_token");



CREATE INDEX "idx_template_purchases_email" ON "public"."template_purchases" USING "btree" ("email");



CREATE INDEX "idx_template_purchases_template" ON "public"."template_purchases" USING "btree" ("template_id");



CREATE INDEX "idx_template_purchases_user" ON "public"."template_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_training_company" ON "public"."training_records" USING "btree" ("company_id");



CREATE INDEX "idx_training_expiry" ON "public"."training_records" USING "btree" ("company_id", "expiry_date");



CREATE INDEX "idx_training_standards" ON "public"."training_records" USING "gin" ("standards");



CREATE INDEX "idx_training_user" ON "public"."training_records" USING "btree" ("user_id");



CREATE INDEX "idx_usage_analytics_company_id" ON "public"."usage_analytics" USING "btree" ("company_id");



CREATE INDEX "idx_usage_analytics_created_at" ON "public"."usage_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_usage_analytics_event_type" ON "public"."usage_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_usage_analytics_user_id" ON "public"."usage_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_usage_billable" ON "public"."usage_analytics" USING "btree" ("billable");



CREATE INDEX "idx_usage_company" ON "public"."usage_analytics" USING "btree" ("company_id");



CREATE INDEX "idx_usage_event" ON "public"."usage_analytics" USING "btree" ("event_type");



CREATE INDEX "idx_usage_timestamp" ON "public"."usage_analytics" USING "btree" ("timestamp");



CREATE INDEX "idx_user_permissions_user" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_company" ON "public"."user_roles" USING "btree" ("company_id");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "calculate_clause_compliance_trigger" BEFORE INSERT OR UPDATE OF "requirements_total", "requirements_met", "requirements_partial", "requirements_not_met" ON "public"."clauses" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_clause_compliance"();



CREATE OR REPLACE TRIGGER "drip_campaigns_updated_at" BEFORE UPDATE ON "public"."drip_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "drip_queue_updated_at" BEFORE UPDATE ON "public"."drip_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "ncr_archive_sync_trigger" AFTER UPDATE ON "public"."ncrs" FOR EACH ROW WHEN ((("old"."archived" IS DISTINCT FROM "new"."archived") OR ("old"."permanently_deleted" IS DISTINCT FROM "new"."permanently_deleted") OR ("old"."status" IS DISTINCT FROM "new"."status"))) EXECUTE FUNCTION "public"."sync_ncr_archive_to_document"();



CREATE OR REPLACE TRIGGER "ncr_to_document_trigger" AFTER INSERT ON "public"."ncrs" FOR EACH ROW EXECUTE FUNCTION "public"."create_document_for_ncr"();



CREATE OR REPLACE TRIGGER "set_comms_updated_at" BEFORE UPDATE ON "public"."communications" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_feedback_updated_at" BEFORE UPDATE ON "public"."customer_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_improvements_updated_at" BEFORE UPDATE ON "public"."improvements" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_ip_updated_at" BEFORE UPDATE ON "public"."interested_parties" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_objectives_updated_at" BEFORE UPDATE ON "public"."quality_objectives" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_risks_updated_at" BEFORE UPDATE ON "public"."risks" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_training_updated_at" BEFORE UPDATE ON "public"."training_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_audits" BEFORE UPDATE ON "public"."audits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_compliance" BEFORE UPDATE ON "public"."compliance_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_subscriptions_updated_at"();



CREATE OR REPLACE TRIGGER "template_instances_updated_at" BEFORE UPDATE ON "public"."template_instances" FOR EACH ROW EXECUTE FUNCTION "public"."update_template_instance_timestamp"();



CREATE OR REPLACE TRIGGER "track_audit_activity" AFTER INSERT OR UPDATE ON "public"."audits" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_stats"();



CREATE OR REPLACE TRIGGER "trg_cancellation_requests_updated_at" BEFORE UPDATE ON "public"."cancellation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."touch_cancellation_requests_updated_at"();



CREATE OR REPLACE TRIGGER "trg_env_aspects_updated" BEFORE UPDATE ON "public"."environmental_aspects" FOR EACH ROW EXECUTE FUNCTION "public"."update_environmental_aspects_updated_at"();



CREATE OR REPLACE TRIGGER "trg_erasure_requests_updated_at" BEFORE UPDATE ON "public"."erasure_requests" FOR EACH ROW EXECUTE FUNCTION "public"."touch_erasure_requests_updated_at"();



CREATE OR REPLACE TRIGGER "trg_hazards_updated" BEFORE UPDATE ON "public"."hazards" FOR EACH ROW EXECUTE FUNCTION "public"."update_hazards_updated_at"();



CREATE OR REPLACE TRIGGER "trg_legal_requirements_updated" BEFORE UPDATE ON "public"."legal_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_legal_requirements_updated_at"();



CREATE OR REPLACE TRIGGER "trg_processes_updated_at" BEFORE UPDATE ON "public"."processes" FOR EACH ROW EXECUTE FUNCTION "public"."update_processes_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_compliance" AFTER INSERT ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."seed_compliance_requirements"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_meetings_updated_at" BEFORE UPDATE ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ncrs_updated_at" BEFORE UPDATE ON "public"."ncrs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_operations"
    ADD CONSTRAINT "ai_operations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."ai_operations"
    ADD CONSTRAINT "ai_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_standard_code_fkey" FOREIGN KEY ("standard_code") REFERENCES "public"."iso_standards"("standard_code");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_checklist"
    ADD CONSTRAINT "audit_checklist_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_checklist"
    ADD CONSTRAINT "audit_checklist_audit_session_id_fkey" FOREIGN KEY ("audit_session_id") REFERENCES "public"."audit_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_checklist"
    ADD CONSTRAINT "audit_checklist_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_findings"
    ADD CONSTRAINT "audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_findings"
    ADD CONSTRAINT "audit_findings_audit_session_id_fkey" FOREIGN KEY ("audit_session_id") REFERENCES "public"."audit_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_findings"
    ADD CONSTRAINT "audit_findings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_sessions"
    ADD CONSTRAINT "audit_sessions_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_sessions"
    ADD CONSTRAINT "audit_sessions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_sessions"
    ADD CONSTRAINT "audit_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_assigned_auditor_id_fkey" FOREIGN KEY ("assigned_auditor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."audits"
    ADD CONSTRAINT "audits_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cancellation_requests"
    ADD CONSTRAINT "cancellation_requests_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clauses"
    ADD CONSTRAINT "clauses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clauses"
    ADD CONSTRAINT "clauses_standard_code_fkey" FOREIGN KEY ("standard_code") REFERENCES "public"."iso_standards"("standard_code");



ALTER TABLE ONLY "public"."client_health"
    ADD CONSTRAINT "client_health_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_client_company_id_fkey" FOREIGN KEY ("client_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_history"("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_reseller_company_id_fkey" FOREIGN KEY ("reseller_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id");



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communications"
    ADD CONSTRAINT "communications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_requirements"
    ADD CONSTRAINT "compliance_requirements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."compliance_requirements"
    ADD CONSTRAINT "compliance_requirements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."compliance_requirements"
    ADD CONSTRAINT "compliance_requirements_evidence_document_id_fkey" FOREIGN KEY ("evidence_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."compliance_requirements"
    ADD CONSTRAINT "compliance_requirements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_feedback"
    ADD CONSTRAINT "customer_feedback_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_feedback"
    ADD CONSTRAINT "customer_feedback_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_feedback"
    ADD CONSTRAINT "customer_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."deletion_audit_trail"
    ADD CONSTRAINT "deletion_audit_trail_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_acknowledgements"
    ADD CONSTRAINT "document_acknowledgements_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_acknowledgements"
    ADD CONSTRAINT "document_acknowledgements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_last_reviewed_by_fkey" FOREIGN KEY ("last_reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_supersedes_fkey" FOREIGN KEY ("supersedes") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."drip_queue"
    ADD CONSTRAINT "drip_queue_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."drip_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."environmental_aspects"
    ADD CONSTRAINT "environmental_aspects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."environmental_aspects"
    ADD CONSTRAINT "environmental_aspects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."erasure_requests"
    ADD CONSTRAINT "erasure_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."erasure_requests"
    ADD CONSTRAINT "erasure_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."erasure_requests"
    ADD CONSTRAINT "erasure_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hazards"
    ADD CONSTRAINT "hazards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hazards"
    ADD CONSTRAINT "hazards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_responsible_person_fkey" FOREIGN KEY ("responsible_person") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."interested_parties"
    ADD CONSTRAINT "interested_parties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interested_parties"
    ADD CONSTRAINT "interested_parties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."iso_news_articles"
    ADD CONSTRAINT "iso_news_articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."legal_requirements"
    ADD CONSTRAINT "legal_requirements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_requirements"
    ADD CONSTRAINT "legal_requirements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."management_reviews"
    ADD CONSTRAINT "management_reviews_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."management_reviews"
    ADD CONSTRAINT "management_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."management_reviews"
    ADD CONSTRAINT "management_reviews_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."management_reviews"
    ADD CONSTRAINT "management_reviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_attendees"
    ADD CONSTRAINT "meeting_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."news_fetch_logs"
    ADD CONSTRAINT "news_fetch_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."objective_progress"
    ADD CONSTRAINT "objective_progress_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."objective_progress"
    ADD CONSTRAINT "objective_progress_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "public"."quality_objectives"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."objective_progress"
    ADD CONSTRAINT "objective_progress_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processes"
    ADD CONSTRAINT "processes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processes"
    ADD CONSTRAINT "processes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."processes"
    ADD CONSTRAINT "processes_process_owner_fkey" FOREIGN KEY ("process_owner") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quality_objectives"
    ADD CONSTRAINT "quality_objectives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quality_objectives"
    ADD CONSTRAINT "quality_objectives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quality_objectives"
    ADD CONSTRAINT "quality_objectives_responsible_person_fkey" FOREIGN KEY ("responsible_person") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reseller_clients"
    ADD CONSTRAINT "reseller_clients_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reseller_commissions"
    ADD CONSTRAINT "reseller_commissions_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id");



ALTER TABLE ONLY "public"."reseller_milestones"
    ADD CONSTRAINT "reseller_milestones_reseller_company_id_fkey" FOREIGN KEY ("reseller_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."risks"
    ADD CONSTRAINT "risks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."risks"
    ADD CONSTRAINT "risks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."risks"
    ADD CONSTRAINT "risks_responsible_person_fkey" FOREIGN KEY ("responsible_person") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_instance_history"
    ADD CONSTRAINT "template_instance_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_instance_history"
    ADD CONSTRAINT "template_instance_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "public"."template_instances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_parent_instance_id_fkey" FOREIGN KEY ("parent_instance_id") REFERENCES "public"."template_instances"("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_instances"
    ADD CONSTRAINT "template_instances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."template_purchases"
    ADD CONSTRAINT "template_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."usage_analytics"
    ADD CONSTRAINT "usage_analytics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."usage_analytics"
    ADD CONSTRAINT "usage_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can create referral" ON "public"."referrals" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can submit assessment" ON "public"."iso_readiness_assessments" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can submit assessments" ON "public"."iso_readiness_assessments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit consultation request" ON "public"."consultation_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can submit consultation requests" ON "public"."consultation_requests" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view assessments" ON "public"."iso_readiness_assessments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view consultation requests" ON "public"."consultation_requests" FOR SELECT USING (true);



CREATE POLICY "Company admins can manage checklist" ON "public"."audit_checklist" USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company admins can manage findings" ON "public"."audit_findings" USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company members can view own invoices" ON "public"."invoices" FOR SELECT USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company members can view own payments" ON "public"."payment_history" FOR SELECT USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company users can manage audit sessions" ON "public"."audit_sessions" USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company users can view checklist" ON "public"."audit_checklist" FOR SELECT USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Company users can view findings" ON "public"."audit_findings" FOR SELECT USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Service role can insert AI usage" ON "public"."ai_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert payments" ON "public"."payment_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage invoices" ON "public"."invoices" WITH CHECK (true);



CREATE POLICY "Super admin can update consultation requests" ON "public"."consultation_requests" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can update referrals" ON "public"."referrals" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can view all invoices" ON "public"."invoices" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can view all payments" ON "public"."payment_history" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can view assessments" ON "public"."iso_readiness_assessments" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can view consultation requests" ON "public"."consultation_requests" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all AI usage" ON "public"."ai_usage" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all acknowledgements" ON "public"."document_acknowledgements" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all audit sessions" ON "public"."audit_sessions" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all findings" ON "public"."audit_findings" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all purchases" ON "public"."template_purchases" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can view all versions" ON "public"."document_versions" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "System can insert notifications" ON "public"."notification_log" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can acknowledge documents in their company" ON "public"."document_acknowledgements" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id_text"()) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can delete own company communications" ON "public"."communications" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company feedback" ON "public"."customer_feedback" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company improvements" ON "public"."improvements" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company interested parties" ON "public"."interested_parties" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company objectives" ON "public"."quality_objectives" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company risks" ON "public"."risks" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company suppliers" ON "public"."suppliers" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can delete own company training" ON "public"."training_records" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company communications" ON "public"."communications" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company feedback" ON "public"."customer_feedback" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company improvements" ON "public"."improvements" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company interested parties" ON "public"."interested_parties" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company objectives" ON "public"."quality_objectives" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company progress" ON "public"."objective_progress" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company risks" ON "public"."risks" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company suppliers" ON "public"."suppliers" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own company training" ON "public"."training_records" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can insert own purchases" ON "public"."template_purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert versions for their company" ON "public"."document_versions" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id_text"()));



CREATE POLICY "Users can manage own conversations" ON "public"."ai_conversations" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own company communications" ON "public"."communications" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company feedback" ON "public"."customer_feedback" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company improvements" ON "public"."improvements" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company interested parties" ON "public"."interested_parties" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company objectives" ON "public"."quality_objectives" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company risks" ON "public"."risks" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company suppliers" ON "public"."suppliers" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can update own company training" ON "public"."training_records" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"())) WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can view acknowledgements for their company" ON "public"."document_acknowledgements" FOR SELECT USING (("company_id" = "public"."get_my_company_id_text"()));



CREATE POLICY "Users can view own company AI usage" ON "public"."ai_usage" FOR SELECT USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "Users can view own company communications" ON "public"."communications" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company feedback" ON "public"."customer_feedback" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company improvements" ON "public"."improvements" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company interested parties" ON "public"."interested_parties" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company notifications" ON "public"."notification_log" FOR SELECT TO "authenticated" USING (((("company_id")::"text" = ("public"."get_my_company_id"())::"text") OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company objectives" ON "public"."quality_objectives" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company progress" ON "public"."objective_progress" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company risks" ON "public"."risks" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company suppliers" ON "public"."suppliers" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own company training" ON "public"."training_records" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view own purchases" ON "public"."template_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT TO "authenticated" USING ((("referrer_id" = "auth"."uid"()) OR "public"."is_super_admin"()));



CREATE POLICY "Users can view versions for their company" ON "public"."document_versions" FOR SELECT USING (("company_id" = "public"."get_my_company_id_text"()));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_operations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_operations_delete" ON "public"."ai_operations" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "ai_operations_insert" ON "public"."ai_operations" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "ai_operations_select" ON "public"."ai_operations" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "ai_operations_update" ON "public"."ai_operations" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



ALTER TABLE "public"."ai_recommendations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_recommendations_delete" ON "public"."ai_recommendations" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "ai_recommendations_insert" ON "public"."ai_recommendations" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "ai_recommendations_select" ON "public"."ai_recommendations" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "ai_recommendations_update" ON "public"."ai_recommendations" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."ai_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_subscribe" ON "public"."news_subscribers" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."audit_checklist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_findings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_insert" ON "public"."audit_log" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "audit_log_select" ON "public"."audit_log" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_delete" ON "public"."audit_logs" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "audit_logs_insert" ON "public"."audit_logs" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("user_id" = "auth"."uid"())));



CREATE POLICY "audit_logs_select" ON "public"."audit_logs" FOR SELECT USING (("public"."is_super_admin"() OR ("user_id" = "auth"."uid"())));



CREATE POLICY "audit_logs_update" ON "public"."audit_logs" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."audit_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audits_delete" ON "public"."audits" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "audits_insert" ON "public"."audits" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "audits_select" ON "public"."audits" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "audits_update" ON "public"."audits" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



ALTER TABLE "public"."cancellation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cancellation_requests_insert_admin" ON "public"."cancellation_requests" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"])))))));



CREATE POLICY "cancellation_requests_select_company" ON "public"."cancellation_requests" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "cancellation_requests_update_superadmin" ON "public"."cancellation_requests" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "cancellation_requests_withdraw_own" ON "public"."cancellation_requests" FOR UPDATE USING ((("requested_by" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("requested_by" = "auth"."uid"()) AND ("status" = ANY (ARRAY['pending'::"text", 'withdrawn'::"text"]))));



ALTER TABLE "public"."clauses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clauses_delete" ON "public"."clauses" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "clauses_insert" ON "public"."clauses" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "clauses_select" ON "public"."clauses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "clauses_update" ON "public"."clauses" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."client_health" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_health_delete" ON "public"."client_health" FOR DELETE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "client_health_insert" ON "public"."client_health" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "client_health_select" ON "public"."client_health" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"()) OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "client_health_update" ON "public"."client_health" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete" ON "public"."clients" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "clients_insert" ON "public"."clients" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "clients_select" ON "public"."clients" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "clients_update" ON "public"."clients" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "commissions_delete" ON "public"."commissions" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "commissions_insert" ON "public"."commissions" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "commissions_select" ON "public"."commissions" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "commissions_update" ON "public"."commissions" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_select" ON "public"."companies" FOR SELECT USING ((("id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("id")));



CREATE POLICY "companies_update" ON "public"."companies" FOR UPDATE USING ((("id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."compliance_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compliance_reports_delete" ON "public"."compliance_reports" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "compliance_reports_insert" ON "public"."compliance_reports" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "compliance_reports_select" ON "public"."compliance_reports" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "compliance_reports_update" ON "public"."compliance_reports" FOR UPDATE USING ("public"."is_super_admin"());



CREATE POLICY "compliance_req_delete" ON "public"."compliance_requirements" FOR DELETE USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "compliance_req_insert" ON "public"."compliance_requirements" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "compliance_req_select" ON "public"."compliance_requirements" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "compliance_req_update" ON "public"."compliance_requirements" FOR UPDATE USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."compliance_requirements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deletion_audit_trail" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deletion_trail_insert" ON "public"."deletion_audit_trail" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id_text"()) OR "public"."is_super_admin"()));



CREATE POLICY "deletion_trail_select" ON "public"."deletion_audit_trail" FOR SELECT USING ((("company_id" = "public"."get_my_company_id_text"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."document_acknowledgements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "document_approvals_delete" ON "public"."document_approvals" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "document_approvals_insert" ON "public"."document_approvals" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "document_approvals_select" ON "public"."document_approvals" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "document_approvals_update" ON "public"."document_approvals" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."document_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents_backup" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_backup_delete" ON "public"."documents_backup" FOR DELETE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "documents_backup_insert" ON "public"."documents_backup" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "documents_backup_select" ON "public"."documents_backup" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "documents_backup_update" ON "public"."documents_backup" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "documents_delete" ON "public"."documents" FOR DELETE USING (("company_id" = "public"."get_my_company_id_text"()));



CREATE POLICY "documents_insert" ON "public"."documents" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id_text"()));



CREATE POLICY "documents_select" ON "public"."documents" FOR SELECT USING ((("company_id" = "public"."get_my_company_id_text"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_text"("company_id")));



CREATE POLICY "documents_update" ON "public"."documents" FOR UPDATE USING (("company_id" = "public"."get_my_company_id_text"()));



ALTER TABLE "public"."drip_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drip_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drip_unsubscribes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "env_aspects_delete" ON "public"."environmental_aspects" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "env_aspects_insert" ON "public"."environmental_aspects" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "env_aspects_select" ON "public"."environmental_aspects" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "env_aspects_update" ON "public"."environmental_aspects" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



ALTER TABLE "public"."environmental_aspects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."erasure_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "erasure_requests_insert_own" ON "public"."erasure_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "erasure_requests_select_own" ON "public"."erasure_requests" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_super_admin"()));



CREATE POLICY "erasure_requests_update_superadmin" ON "public"."erasure_requests" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "erasure_requests_withdraw_own" ON "public"."erasure_requests" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['pending'::"text", 'withdrawn'::"text"]))));



ALTER TABLE "public"."failed_login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hazards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hazards_delete" ON "public"."hazards" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "hazards_insert" ON "public"."hazards" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "hazards_select" ON "public"."hazards" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "hazards_update" ON "public"."hazards" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



ALTER TABLE "public"."improvements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interested_parties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_insert" ON "public"."invoices" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "invoices_select" ON "public"."invoices" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."iso_news_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iso_readiness_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."iso_standards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "iso_standards_delete" ON "public"."iso_standards" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "iso_standards_insert" ON "public"."iso_standards" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "iso_standards_select" ON "public"."iso_standards" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "iso_standards_update" ON "public"."iso_standards" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."legal_requirements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "legal_requirements_delete" ON "public"."legal_requirements" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "legal_requirements_insert" ON "public"."legal_requirements" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "legal_requirements_select" ON "public"."legal_requirements" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "legal_requirements_update" ON "public"."legal_requirements" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "ma_delete" ON "public"."meeting_attendees" FOR DELETE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "ma_insert" ON "public"."meeting_attendees" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "ma_select" ON "public"."meeting_attendees" FOR SELECT USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "ma_update" ON "public"."meeting_attendees" FOR UPDATE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



ALTER TABLE "public"."management_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meeting_attendees_delete" ON "public"."meeting_attendees" FOR DELETE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "meeting_attendees_insert" ON "public"."meeting_attendees" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "meeting_attendees_select" ON "public"."meeting_attendees" FOR SELECT USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "meeting_attendees_update" ON "public"."meeting_attendees" FOR UPDATE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."meetings" "m"
  WHERE (("m"."id" = "meeting_attendees"."meeting_id") AND ("m"."company_id" = "public"."get_my_company_id"()))))));



ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meetings_delete" ON "public"."meetings" FOR DELETE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "meetings_insert" ON "public"."meetings" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "meetings_select" ON "public"."meetings" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "meetings_update" ON "public"."meetings" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



ALTER TABLE "public"."ncrs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ncrs_delete" ON "public"."ncrs" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "ncrs_insert" ON "public"."ncrs" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "ncrs_select" ON "public"."ncrs" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "ncrs_update" ON "public"."ncrs" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



ALTER TABLE "public"."news_fetch_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."objective_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_delete" ON "public"."payments" FOR DELETE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "payments_insert" ON "public"."payments" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "payments_select" ON "public"."payments" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



CREATE POLICY "payments_update" ON "public"."payments" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id"())));



ALTER TABLE "public"."processes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "processes_delete" ON "public"."processes" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "processes_insert" ON "public"."processes" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "processes_select" ON "public"."processes" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "processes_update" ON "public"."processes" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "public_read_published_articles" ON "public"."iso_news_articles" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."quality_objectives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reseller_clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reseller_clients_select" ON "public"."reseller_clients" FOR SELECT USING ((("reseller_id" IN ( SELECT "r"."id"
   FROM ("public"."resellers" "r"
     JOIN "public"."users" "u" ON (("u"."email" = "r"."contact_email")))
  WHERE ("u"."id" = "auth"."uid"()))) OR "public"."is_super_admin"()));



ALTER TABLE "public"."reseller_commissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reseller_commissions_delete" ON "public"."reseller_commissions" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "reseller_commissions_insert" ON "public"."reseller_commissions" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "reseller_commissions_select" ON "public"."reseller_commissions" FOR SELECT USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."resellers" "r"
  WHERE (("r"."id" = "reseller_commissions"."reseller_id") AND ("r"."contact_email" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "reseller_commissions_update" ON "public"."reseller_commissions" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."reseller_milestones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reseller_milestones_delete" ON "public"."reseller_milestones" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "reseller_milestones_insert" ON "public"."reseller_milestones" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "reseller_milestones_select" ON "public"."reseller_milestones" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "reseller_milestones_update" ON "public"."reseller_milestones" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."resellers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resellers_select" ON "public"."resellers" FOR SELECT USING ((("contact_email" = ( SELECT "users"."email"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR "public"."is_super_admin"()));



CREATE POLICY "reviews_delete" ON "public"."management_reviews" FOR DELETE USING (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "reviews_insert" ON "public"."management_reviews" FOR INSERT WITH CHECK (("company_id" = "public"."get_my_company_id"()));



CREATE POLICY "reviews_select" ON "public"."management_reviews" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "reviews_update" ON "public"."management_reviews" FOR UPDATE USING (("company_id" = "public"."get_my_company_id"()));



ALTER TABLE "public"."risks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_events_delete" ON "public"."security_events" FOR DELETE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id_text"())));



CREATE POLICY "security_events_insert" ON "public"."security_events" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id_text"())));



CREATE POLICY "security_events_select" ON "public"."security_events" FOR SELECT USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id_text"())));



CREATE POLICY "security_events_update" ON "public"."security_events" FOR UPDATE USING (("public"."is_super_admin"() OR ("company_id" = "public"."get_my_company_id_text"())));



CREATE POLICY "service_role_news_articles" ON "public"."iso_news_articles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_news_fetch_logs" ON "public"."news_fetch_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_news_subscribers" ON "public"."news_subscribers" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select" ON "public"."subscriptions" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "super_admin_all_template_purchases" ON "public"."template_purchases" USING ("public"."is_super_admin"());



CREATE POLICY "super_admin_full_access_commissions" ON "public"."commissions" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "super_admin_full_access_drip_campaigns" ON "public"."drip_campaigns" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "super_admin_full_access_drip_queue" ON "public"."drip_queue" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "super_admin_news_articles" ON "public"."iso_news_articles" USING ("public"."is_super_admin"());



CREATE POLICY "super_admin_news_fetch_logs" ON "public"."news_fetch_logs" USING ("public"."is_super_admin"());



CREATE POLICY "super_admin_news_sources" ON "public"."news_sources" USING ("public"."is_super_admin"());



CREATE POLICY "super_admin_news_subscribers" ON "public"."news_subscribers" USING ("public"."is_super_admin"());



CREATE POLICY "super_admin_read_drip_unsubscribes" ON "public"."drip_unsubscribes" FOR SELECT USING ("public"."is_super_admin"());



ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_metrics_delete" ON "public"."system_metrics" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "system_metrics_insert" ON "public"."system_metrics" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "system_metrics_select" ON "public"."system_metrics" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "system_metrics_update" ON "public"."system_metrics" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_delete" ON "public"."team_members" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "team_members_insert" ON "public"."team_members" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "team_members_select" ON "public"."team_members" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "team_members_update" ON "public"."team_members" FOR UPDATE USING ("public"."is_super_admin"());



ALTER TABLE "public"."template_instance_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "template_instance_history_insert" ON "public"."template_instance_history" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."template_instances" "ti"
  WHERE (("ti"."id" = "template_instance_history"."instance_id") AND (("ti"."company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"())))));



CREATE POLICY "template_instance_history_read" ON "public"."template_instance_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."template_instances" "ti"
  WHERE (("ti"."id" = "template_instance_history"."instance_id") AND (("ti"."company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"())))));



ALTER TABLE "public"."template_instances" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "template_instances_company_delete" ON "public"."template_instances" FOR DELETE USING (((("company_id" = "public"."get_my_company_id"()) AND ("status" = 'draft'::"text")) OR "public"."is_super_admin"()));



CREATE POLICY "template_instances_company_insert" ON "public"."template_instances" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "template_instances_company_read" ON "public"."template_instances" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR "public"."is_reseller_for_uuid"("company_id")));



CREATE POLICY "template_instances_company_update" ON "public"."template_instances" FOR UPDATE USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."template_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "up_delete" ON "public"."user_permissions" FOR DELETE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "user_permissions"."user_id") AND ("u"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "up_insert" ON "public"."user_permissions" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "user_permissions"."user_id") AND ("u"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "up_select" ON "public"."user_permissions" FOR SELECT USING (("public"."is_super_admin"() OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "user_permissions"."user_id") AND ("u"."company_id" = "public"."get_my_company_id"()))))));



CREATE POLICY "up_update" ON "public"."user_permissions" FOR UPDATE USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "user_permissions"."user_id") AND ("u"."company_id" = "public"."get_my_company_id"()))))));



ALTER TABLE "public"."usage_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usage_analytics_insert" ON "public"."usage_analytics" FOR INSERT WITH CHECK ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



CREATE POLICY "usage_analytics_select" ON "public"."usage_analytics" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"()));



ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_select" ON "public"."user_roles" FOR SELECT USING (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_template_purchases" ON "public"."template_purchases" FOR SELECT USING (("email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text"));



CREATE POLICY "users_select" ON "public"."users" FOR SELECT USING ((("company_id" = "public"."get_my_company_id"()) OR "public"."is_super_admin"() OR ("id" = "auth"."uid"())));



CREATE POLICY "users_update" ON "public"."users" FOR UPDATE USING ((("id" = "auth"."uid"()) OR "public"."is_super_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."calculate_clause_compliance"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_clause_compliance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_clause_compliance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_document_for_ncr"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_document_for_ncr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_for_ncr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_company_id_text"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_company_id_text"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_company_id_text"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_reseller_for_text"("target_company_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_reseller_for_text"("target_company_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_reseller_for_text"("target_company_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_reseller_for_uuid"("target_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_reseller_for_uuid"("target_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_reseller_for_uuid"("target_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."next_audit_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."next_audit_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_audit_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."next_doc_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."next_doc_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_doc_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."next_ncr_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."next_ncr_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_ncr_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."next_review_number"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."next_review_number"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_review_number"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_client_compliance"("client_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_client_compliance"("client_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_client_compliance"("client_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_compliance_requirements"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_compliance_requirements"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_compliance_requirements"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_user_permissions"("p_user_id" "uuid", "p_role" "public"."user_role_type") TO "anon";
GRANT ALL ON FUNCTION "public"."seed_user_permissions"("p_user_id" "uuid", "p_role" "public"."user_role_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_user_permissions"("p_user_id" "uuid", "p_role" "public"."user_role_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_ncr_archive_to_document"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_ncr_archive_to_document"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_ncr_archive_to_document"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_cancellation_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_cancellation_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_cancellation_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_erasure_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_erasure_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_erasure_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_environmental_aspects_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_environmental_aspects_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_environmental_aspects_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_hazards_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_hazards_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_hazards_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_legal_requirements_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_legal_requirements_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_legal_requirements_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_processes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_processes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_processes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscriptions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_template_instance_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_template_instance_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_template_instance_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_owns_client"("client_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_owns_client"("client_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_owns_client"("client_uuid" "uuid") TO "service_role";
























GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_operations" TO "anon";
GRANT ALL ON TABLE "public"."ai_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_operations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."audit_checklist" TO "anon";
GRANT ALL ON TABLE "public"."audit_checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_checklist" TO "service_role";



GRANT ALL ON TABLE "public"."audit_findings" TO "anon";
GRANT ALL ON TABLE "public"."audit_findings" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_findings" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_sessions" TO "anon";
GRANT ALL ON TABLE "public"."audit_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."audits" TO "anon";
GRANT ALL ON TABLE "public"."audits" TO "authenticated";
GRANT ALL ON TABLE "public"."audits" TO "service_role";



GRANT ALL ON TABLE "public"."cancellation_requests" TO "anon";
GRANT ALL ON TABLE "public"."cancellation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."cancellation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."clauses" TO "anon";
GRANT ALL ON TABLE "public"."clauses" TO "authenticated";
GRANT ALL ON TABLE "public"."clauses" TO "service_role";



GRANT ALL ON TABLE "public"."client_health" TO "anon";
GRANT ALL ON TABLE "public"."client_health" TO "authenticated";
GRANT ALL ON TABLE "public"."client_health" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT ALL ON TABLE "public"."communications" TO "anon";
GRANT ALL ON TABLE "public"."communications" TO "authenticated";
GRANT ALL ON TABLE "public"."communications" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_reports" TO "anon";
GRANT ALL ON TABLE "public"."compliance_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_reports" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_requirements" TO "anon";
GRANT ALL ON TABLE "public"."compliance_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."consultation_requests" TO "anon";
GRANT ALL ON TABLE "public"."consultation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."consultation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."customer_feedback" TO "anon";
GRANT ALL ON TABLE "public"."customer_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."deletion_audit_trail" TO "anon";
GRANT ALL ON TABLE "public"."deletion_audit_trail" TO "authenticated";
GRANT ALL ON TABLE "public"."deletion_audit_trail" TO "service_role";



GRANT ALL ON TABLE "public"."document_acknowledgements" TO "anon";
GRANT ALL ON TABLE "public"."document_acknowledgements" TO "authenticated";
GRANT ALL ON TABLE "public"."document_acknowledgements" TO "service_role";



GRANT ALL ON TABLE "public"."document_approvals" TO "anon";
GRANT ALL ON TABLE "public"."document_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."document_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."document_versions" TO "anon";
GRANT ALL ON TABLE "public"."document_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_versions" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."documents_backup" TO "anon";
GRANT ALL ON TABLE "public"."documents_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."documents_backup" TO "service_role";



GRANT ALL ON TABLE "public"."drip_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."drip_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."drip_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."drip_queue" TO "anon";
GRANT ALL ON TABLE "public"."drip_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."drip_queue" TO "service_role";



GRANT ALL ON TABLE "public"."drip_unsubscribes" TO "anon";
GRANT ALL ON TABLE "public"."drip_unsubscribes" TO "authenticated";
GRANT ALL ON TABLE "public"."drip_unsubscribes" TO "service_role";



GRANT ALL ON TABLE "public"."environmental_aspects" TO "anon";
GRANT ALL ON TABLE "public"."environmental_aspects" TO "authenticated";
GRANT ALL ON TABLE "public"."environmental_aspects" TO "service_role";



GRANT ALL ON TABLE "public"."erasure_requests" TO "anon";
GRANT ALL ON TABLE "public"."erasure_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."erasure_requests" TO "service_role";



GRANT ALL ON TABLE "public"."failed_login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."failed_login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."failed_login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."hazards" TO "anon";
GRANT ALL ON TABLE "public"."hazards" TO "authenticated";
GRANT ALL ON TABLE "public"."hazards" TO "service_role";



GRANT ALL ON TABLE "public"."improvements" TO "anon";
GRANT ALL ON TABLE "public"."improvements" TO "authenticated";
GRANT ALL ON TABLE "public"."improvements" TO "service_role";



GRANT ALL ON TABLE "public"."interested_parties" TO "anon";
GRANT ALL ON TABLE "public"."interested_parties" TO "authenticated";
GRANT ALL ON TABLE "public"."interested_parties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."iso_news_articles" TO "anon";
GRANT ALL ON TABLE "public"."iso_news_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."iso_news_articles" TO "service_role";



GRANT ALL ON TABLE "public"."iso_readiness_assessments" TO "anon";
GRANT ALL ON TABLE "public"."iso_readiness_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."iso_readiness_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."iso_standards" TO "anon";
GRANT ALL ON TABLE "public"."iso_standards" TO "authenticated";
GRANT ALL ON TABLE "public"."iso_standards" TO "service_role";



GRANT ALL ON TABLE "public"."legal_requirements" TO "anon";
GRANT ALL ON TABLE "public"."legal_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."management_reviews" TO "anon";
GRANT ALL ON TABLE "public"."management_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."management_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_attendees" TO "anon";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."ncrs" TO "anon";
GRANT ALL ON TABLE "public"."ncrs" TO "authenticated";
GRANT ALL ON TABLE "public"."ncrs" TO "service_role";



GRANT ALL ON TABLE "public"."news_fetch_logs" TO "anon";
GRANT ALL ON TABLE "public"."news_fetch_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."news_fetch_logs" TO "service_role";



GRANT ALL ON TABLE "public"."news_sources" TO "anon";
GRANT ALL ON TABLE "public"."news_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."news_sources" TO "service_role";



GRANT ALL ON TABLE "public"."news_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."news_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."news_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."notification_log" TO "anon";
GRANT ALL ON TABLE "public"."notification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_log" TO "service_role";



GRANT ALL ON TABLE "public"."objective_progress" TO "anon";
GRANT ALL ON TABLE "public"."objective_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."objective_progress" TO "service_role";



GRANT ALL ON TABLE "public"."payment_history" TO "anon";
GRANT ALL ON TABLE "public"."payment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_history" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."processes" TO "anon";
GRANT ALL ON TABLE "public"."processes" TO "authenticated";
GRANT ALL ON TABLE "public"."processes" TO "service_role";



GRANT ALL ON TABLE "public"."quality_objectives" TO "anon";
GRANT ALL ON TABLE "public"."quality_objectives" TO "authenticated";
GRANT ALL ON TABLE "public"."quality_objectives" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."reseller_clients" TO "anon";
GRANT ALL ON TABLE "public"."reseller_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."reseller_clients" TO "service_role";



GRANT ALL ON TABLE "public"."reseller_commissions" TO "anon";
GRANT ALL ON TABLE "public"."reseller_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."reseller_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."reseller_milestones" TO "anon";
GRANT ALL ON TABLE "public"."reseller_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."reseller_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."resellers" TO "anon";
GRANT ALL ON TABLE "public"."resellers" TO "authenticated";
GRANT ALL ON TABLE "public"."resellers" TO "service_role";



GRANT ALL ON TABLE "public"."risks" TO "anon";
GRANT ALL ON TABLE "public"."risks" TO "authenticated";
GRANT ALL ON TABLE "public"."risks" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_metrics" TO "anon";
GRANT ALL ON TABLE "public"."system_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."template_instance_history" TO "anon";
GRANT ALL ON TABLE "public"."template_instance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."template_instance_history" TO "service_role";



GRANT ALL ON TABLE "public"."template_instances" TO "anon";
GRANT ALL ON TABLE "public"."template_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."template_instances" TO "service_role";



GRANT ALL ON TABLE "public"."template_purchases" TO "anon";
GRANT ALL ON TABLE "public"."template_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."template_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."training_records" TO "anon";
GRANT ALL ON TABLE "public"."training_records" TO "authenticated";
GRANT ALL ON TABLE "public"."training_records" TO "service_role";



GRANT ALL ON TABLE "public"."usage_analytics" TO "anon";
GRANT ALL ON TABLE "public"."usage_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_client_engagement" TO "anon";
GRANT ALL ON TABLE "public"."v_client_engagement" TO "authenticated";
GRANT ALL ON TABLE "public"."v_client_engagement" TO "service_role";



GRANT ALL ON TABLE "public"."v_mrr_by_client" TO "anon";
GRANT ALL ON TABLE "public"."v_mrr_by_client" TO "authenticated";
GRANT ALL ON TABLE "public"."v_mrr_by_client" TO "service_role";



GRANT ALL ON TABLE "public"."v_outstanding_invoices" TO "anon";
GRANT ALL ON TABLE "public"."v_outstanding_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."v_outstanding_invoices" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































