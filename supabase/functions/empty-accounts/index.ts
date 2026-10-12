import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const secretMapRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
const ADMIN_KEY = secretMapRaw
  ? JSON.parse(secretMapRaw)["default"]
  : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, ADMIN_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const allowedOrigins = new Set([
  "https://erenkaynak1.github.io"
]);

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://erenkaynak1.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Vary": "Origin"
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("cf-connecting-ip")
    || forwarded
    || req.headers.get("x-real-ip")
    || "unknown";
}

async function ipHash(req: Request) {
  const input = new TextEncoder().encode("empty-accounts-v1|" + ADMIN_KEY + "|" + clientIp(req));
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeName(raw: unknown) {
  return String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
}

function keyFor(name: string) {
  return name.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: "İzin verilmeyen kaynak." }, 403, origin);
  }

  try {
    const hash = await ipHash(req);

    if (req.method === "GET") {
      const mode = new URL(req.url).searchParams.get("mode");
      if (mode === "daily") {
        const { data, error } = await supabase
          .from("daily_accounts")
          .select("id,name,went_today,went_at,created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return json({ entries: data || [] }, 200, origin);
      }

      const { data: rows, error } = await supabase
        .from("empty_account_results")
        .select("id,name,created_at,correct_count,not_empty_count")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ids = (rows || []).map(r => r.id);
      const mine: Record<string, string> = {};

      if (ids.length) {
        const { data: votes, error: voteError } = await supabase
          .from("empty_account_votes")
          .select("entry_id,vote")
          .eq("ip_hash", hash)
          .in("entry_id", ids);

        if (voteError) throw voteError;
        for (const v of votes || []) mine[v.entry_id] = v.vote;
      }

      return json({
        entries: (rows || []).map(r => ({
          ...r,
          my_vote: mine[r.id] || null
        }))
      }, 200, origin);
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, origin);
    }

    const body = await req.json().catch(() => ({}));

    if (body.action === "daily_add") {
      const name = normalizeName(body.name);
      if (name.length < 2) {
        return json({ error: "İsim en az 2 karakter olmalı." }, 400, origin);
      }

      const { data, error } = await supabase
        .from("daily_accounts")
        .insert({ name, name_key: keyFor(name) })
        .select("id,name,went_today,went_at,created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          return json({ error: "Bu oyuncu zaten listede aşkım" }, 409, origin);
        }
        throw error;
      }

      return json({ entry: data }, 201, origin);
    }

    if (body.action === "daily_mark") {
      const entryId = String(body.entry_id || "");
      const wentToday = Boolean(body.went_today);

      if (!/^[0-9a-f-]{36}$/i.test(entryId)) {
        return json({ error: "Geçersiz kayıt." }, 400, origin);
      }

      const { data, error } = await supabase
        .from("daily_accounts")
        .update({
          went_today: wentToday,
          went_at: wentToday ? new Date().toISOString() : null
        })
        .eq("id", entryId)
        .select("id,name,went_today,went_at,created_at")
        .single();

      if (error) throw error;
      return json({ entry: data }, 200, origin);
    }

    if (body.action === "daily_reset") {
      const { error } = await supabase
        .from("daily_accounts")
        .update({ went_today: false, went_at: null })
        .eq("went_today", true);

      if (error) throw error;
      return json({ ok: true }, 200, origin);
    }

    if (body.action === "add") {
      const name = normalizeName(body.name);
      if (name.length < 2) {
        return json({ error: "İsim en az 2 karakter olmalı." }, 400, origin);
      }

      const { data, error } = await supabase
        .from("empty_accounts")
        .insert({ name, name_key: keyFor(name) })
        .select("id,name,created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          return json({ error: "Bu oyuncu zaten listede aşkım" }, 409, origin);
        }
        throw error;
      }

      return json({ entry: data }, 201, origin);
    }

    if (body.action === "vote") {
      const entryId = String(body.entry_id || "");
      const vote = String(body.vote || "");

      if (!/^[0-9a-f-]{36}$/i.test(entryId)) {
        return json({ error: "Geçersiz kayıt." }, 400, origin);
      }
      if (vote !== "correct" && vote !== "not_empty") {
        return json({ error: "Geçersiz oy." }, 400, origin);
      }

      const { error } = await supabase
        .from("empty_account_votes")
        .upsert(
          { entry_id: entryId, ip_hash: hash, vote },
          { onConflict: "entry_id,ip_hash" }
        );

      if (error) {
        if (error.code === "23503") {
          return json({ error: "Kayıt bulunamadı." }, 404, origin);
        }
        throw error;
      }

      return json({ ok: true }, 200, origin);
    }

    return json({ error: "Geçersiz işlem." }, 400, origin);
  } catch (err) {
    console.error(err);
    return json({ error: "Sunucu hatası." }, 500, origin);
  }
});
