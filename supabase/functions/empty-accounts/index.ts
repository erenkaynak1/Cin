import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const IP_HASH_SECRET = Deno.env.get("IP_HASH_SECRET")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const allowed = new Set(["https://erenkaynak1.github.io"]);
function cors(origin: string | null) {
  const use = origin && allowed.has(origin) ? origin : "https://erenkaynak1.github.io";
  return {
    "Access-Control-Allow-Origin": use,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status=200, origin: string|null=null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function clientIp(req: Request) {
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("cf-connecting-ip") || forwarded || req.headers.get("x-real-ip") || "unknown";
}

async function ipHash(req: Request) {
  if(!IP_HASH_SECRET) throw new Error("IP_HASH_SECRET missing");
  const input=new TextEncoder().encode(IP_HASH_SECRET+"|"+clientIp(req));
  const digest=await crypto.subtle.digest("SHA-256",input);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function normalizeName(raw: unknown) {
  return String(raw ?? "").trim().replace(/\s+/g," ").slice(0,60);
}
function keyFor(name: string) {
  return name.toLocaleLowerCase("tr-TR").replace(/\s+/g," ");
}

Deno.serve(async req => {
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(origin)});
  if(origin && !allowed.has(origin)) return json({error:"İzin verilmeyen kaynak."},403,origin);

  try {
    const hash=await ipHash(req);

    if(req.method==="GET") {
      const { data: rows, error }=await supabase
        .from("empty_account_results")
        .select("id,name,created_at,correct_count,not_empty_count")
        .order("created_at",{ascending:false});
      if(error) throw error;

      const ids=(rows||[]).map(r=>r.id);
      let mine: Record<string,string>={};
      if(ids.length) {
        const { data: votes, error: voteError }=await supabase
          .from("empty_account_votes")
          .select("entry_id,vote")
          .eq("ip_hash",hash)
          .in("entry_id",ids);
        if(voteError) throw voteError;
        for(const v of votes||[]) mine[v.entry_id]=v.vote;
      }
      return json({entries:(rows||[]).map(r=>({...r,my_vote:mine[r.id]||null}))},200,origin);
    }

    if(req.method!=="POST") return json({error:"Method not allowed."},405,origin);
    const body=await req.json().catch(()=>({}));

    if(body.action==="add") {
      const name=normalizeName(body.name);
      if(name.length<2) return json({error:"İsim en az 2 karakter olmalı."},400,origin);
      const { data, error }=await supabase
        .from("empty_accounts")
        .insert({name,name_key:keyFor(name)})
        .select("id,name,created_at")
        .single();
      if(error) {
        if(error.code==="23505") return json({error:"Bu isim zaten listede."},409,origin);
        throw error;
      }
      return json({entry:data},201,origin);
    }

    if(body.action==="vote") {
      const entryId=String(body.entry_id||"");
      const vote=String(body.vote||"");
      if(!/^[0-9a-f-]{36}$/i.test(entryId)) return json({error:"Geçersiz kayıt."},400,origin);
      if(vote!=="correct" && vote!=="not_empty") return json({error:"Geçersiz oy."},400,origin);
      const { error }=await supabase.from("empty_account_votes").insert({
        entry_id:entryId, ip_hash:hash, vote
      });
      if(error) {
        if(error.code==="23505") return json({error:"Bu isim için daha önce oy kullandın."},409,origin);
        if(error.code==="23503") return json({error:"Kayıt bulunamadı."},404,origin);
        throw error;
      }
      return json({ok:true},201,origin);
    }

    return json({error:"Geçersiz işlem."},400,origin);
  } catch(err) {
    console.error(err);
    return json({error:"Sunucu hatası."},500,origin);
  }
});
