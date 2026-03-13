// ISOGuardian Auditor Portal Edge Function
// Provides token-based access for external auditors (no Supabase account needed)
//
// Endpoints:
// POST /validate  — Validate auditor access token, return session info
// POST /findings  — Submit audit finding
// POST /checklist — Update clause checklist result
// GET  /evidence  — Get evidence package for the audit
//
// Deploy: supabase functions deploy auditor-portal

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import { publicCorsHeaders as corsHeaders } from "../_shared/cors.ts";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Validate Auditor Token ──────────────────────────────────────────────────

async function validateToken(token: string) {
  const { data: session, error } = await supabase
    .from("audit_sessions")
    .select(`
      id, audit_id, company_id, auditor_name, auditor_email,
      auditor_organisation, status, expires_at,
      audits!inner(audit_number, audit_type, standard, scope, audit_date, status)
    `)
    .eq("access_token", token)
    .single();

  if (error || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from("audit_sessions")
      .update({ status: "expired" })
      .eq("id", session.id);
    return null;
  }

  // Check status
  if (session.status === "expired" || session.status === "revoked") {
    return null;
  }

  return session;
}

// ─── Get Pre-Audit Evidence Package ──────────────────────────────────────────

async function getEvidencePackage(session: any) {
  const companyId = session.company_id;
  const audit = session.audits;
  const standard = audit?.standard;

  // Fetch company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, industry, company_code, logo_url")
    .eq("id", companyId)
    .single();

  // Fetch documents for this standard
  const docsQuery = supabase
    .from("documents")
    .select("id, title, document_number, standard, clause, type, status, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("archived", false)
    .order("standard")
    .order("clause");

  if (standard) {
    docsQuery.eq("standard", standard);
  }

  const { data: documents } = await docsQuery;

  // Fetch open NCRs
  const { data: ncrs } = await supabase
    .from("ncrs")
    .select("id, ncr_number, title, status, severity, standard, clause, created_at, target_close_date")
    .eq("company_id", companyId)
    .eq("archived", false);

  // Fetch compliance scores
  const compQuery = supabase
    .from("compliance_requirements")
    .select("standard, clause, clause_title, status, score, evidence_notes")
    .eq("company_id", companyId);

  if (standard) {
    compQuery.eq("standard", standard);
  }

  const { data: compliance } = await compQuery;

  // Fetch previous audits
  const { data: previousAudits } = await supabase
    .from("audits")
    .select("id, audit_number, audit_type, standard, status, audit_date, conclusion")
    .eq("company_id", companyId)
    .eq("status", "Complete")
    .order("audit_date", { ascending: false })
    .limit(5);

  // Fetch management reviews
  const { data: reviews } = await supabase
    .from("management_reviews")
    .select("id, title, review_date, status")
    .eq("company_id", companyId)
    .order("review_date", { ascending: false })
    .limit(3);

  return {
    company: {
      name: company?.name,
      industry: company?.industry,
      code: company?.company_code,
      logoUrl: company?.logo_url,
    },
    audit: {
      title: audit?.audit_number,
      type: audit?.audit_type,
      standard: audit?.standard,
      scope: audit?.scope,
      scheduledDate: audit?.audit_date,
    },
    documents: documents || [],
    openNcrs: ncrs || [],
    compliance: compliance || [],
    previousAudits: previousAudits || [],
    recentReviews: reviews || [],
    summary: {
      totalDocuments: (documents || []).length,
      openNcrs: (ncrs || []).filter((n: any) => n.status === "Open").length,
      criticalNcrs: (ncrs || []).filter((n: any) => n.severity === "Critical").length,
      complianceAvg: compliance?.length
        ? Math.round(
            compliance.reduce((s: number, c: any) => s + (c.score || 0), 0) / compliance.length
          )
        : 0,
    },
  };
}

// ─── Submit Finding ──────────────────────────────────────────────────────────

async function submitFinding(session: any, body: any) {
  const { clause, standard, finding_type, description, evidence, auditor_notes } = body;

  if (!clause || !standard || !finding_type || !description) {
    return jsonResponse({ error: "Missing required fields: clause, standard, finding_type, description" }, 400);
  }

  const validTypes = ["major_nc", "minor_nc", "observation", "opportunity", "conformity"];
  if (!validTypes.includes(finding_type)) {
    return jsonResponse({ error: `Invalid finding_type. Must be one of: ${validTypes.join(", ")}` }, 400);
  }

  const { data, error } = await supabase
    .from("audit_findings")
    .insert({
      audit_session_id: session.id,
      audit_id: session.audit_id,
      company_id: session.company_id,
      clause,
      standard,
      finding_type,
      description,
      evidence: evidence || null,
      auditor_notes: auditor_notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert finding error:", error);
    return jsonResponse({ error: "Failed to save finding" }, 500);
  }

  // Auto-create NCR for major/minor non-conformities
  if (finding_type === "major_nc" || finding_type === "minor_nc") {
    await supabase.from("ncrs").insert({
      company_id: session.company_id,
      title: `Audit Finding: ${description.slice(0, 100)}`,
      description,
      standard,
      clause,
      severity: finding_type === "major_nc" ? "Critical" : "Major",
      status: "Open",
      source: "External Audit",
      raised_by: session.auditor_name,
    });
  }

  return jsonResponse({ finding: data });
}

// ─── Update Checklist ────────────────────────────────────────────────────────

async function updateChecklist(session: any, body: any) {
  const { clause, standard, clause_title, result, notes } = body;

  if (!clause || !standard || !result) {
    return jsonResponse({ error: "Missing required fields: clause, standard, result" }, 400);
  }

  const validResults = ["conforming", "non_conforming", "not_applicable", "not_audited"];
  if (!validResults.includes(result)) {
    return jsonResponse({ error: `Invalid result. Must be one of: ${validResults.join(", ")}` }, 400);
  }

  // Upsert: update existing or insert new
  const { data: existing } = await supabase
    .from("audit_checklist")
    .select("id")
    .eq("audit_session_id", session.id)
    .eq("standard", standard)
    .eq("clause", clause)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("audit_checklist")
      .update({ result, notes: notes || null, checked_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) return jsonResponse({ error: "Failed to update checklist" }, 500);
  } else {
    const { error } = await supabase
      .from("audit_checklist")
      .insert({
        audit_session_id: session.id,
        audit_id: session.audit_id,
        company_id: session.company_id,
        standard,
        clause,
        clause_title: clause_title || clause,
        result,
        notes: notes || null,
        checked_at: new Date().toISOString(),
      });

    if (error) return jsonResponse({ error: "Failed to save checklist item" }, 500);
  }

  return jsonResponse({ success: true });
}

// ─── Upload Evidence Photo ───────────────────────────────────────────────────

async function uploadPhoto(session: any, req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse({ error: "Expected multipart/form-data" }, 400);
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  const findingId = formData.get("finding_id") as string | null;

  if (!file) {
    return jsonResponse({ error: "No photo file provided" }, 400);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return jsonResponse({ error: "Invalid file type. Allowed: jpg, png, webp, heic" }, 400);
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return jsonResponse({ error: "File too large. Maximum 5MB" }, 400);
  }

  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, '') || "jpg";
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().slice(0, 8);
  const path = `audit-evidence/${session.audit_id}/${findingId || "general"}/${timestamp}-${randomId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return jsonResponse({ error: "Failed to upload photo" }, 500);
  }

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);

  // If tied to a finding, append to evidence_photos
  if (findingId) {
    const { data: finding } = await supabase
      .from("audit_findings")
      .select("evidence_photos")
      .eq("id", findingId)
      .eq("audit_session_id", session.id)
      .single();

    const photos = finding?.evidence_photos || [];
    photos.push(urlData.publicUrl);

    await supabase
      .from("audit_findings")
      .update({ evidence_photos: photos })
      .eq("id", findingId);
  }

  return jsonResponse({ url: urlData.publicUrl });
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const token = req.headers.get("x-auditor-token") || "";

    // Validate token for all endpoints
    if (!token) {
      return jsonResponse({ error: "Missing auditor access token" }, 401);
    }

    const session = await validateToken(token);
    if (!session) {
      return jsonResponse({ error: "Invalid or expired access token" }, 401);
    }

    // Activate session on first use
    if (session.status === "pending") {
      await supabase
        .from("audit_sessions")
        .update({ status: "active" })
        .eq("id", session.id);
    }

    switch (path) {
      case "validate":
        return jsonResponse({
          session: {
            id: session.id,
            auditorName: session.auditor_name,
            auditorEmail: session.auditor_email,
            auditorOrganisation: session.auditor_organisation,
            status: session.status === "pending" ? "active" : session.status,
            expiresAt: session.expires_at,
          },
          audit: session.audits,
        });

      case "evidence":
        const evidence = await getEvidencePackage(session);
        return jsonResponse(evidence);

      case "findings": {
        if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
        const body = await req.json();
        return await submitFinding(session, body);
      }

      case "checklist": {
        if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
        const body = await req.json();
        return await updateChecklist(session, body);
      }

      case "upload": {
        if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
        return await uploadPhoto(session, req);
      }

      default:
        return jsonResponse({ error: "Unknown endpoint" }, 404);
    }
  } catch (err) {
    console.error("Auditor Portal error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
