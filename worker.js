export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response("", { headers: cors() });
    }

    if (path === "/api/content" && request.method === "GET") {
      return json(await getContent(env));
    }

    if (path === "/api/ad-session" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.ymid || !body.content_id) return json({error:"missing fields"},400);
        if (env.DB) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO ad_sessions (ymid, telegram_id, content_id, created_at) VALUES (?, ?, ?, ?)"
          ).bind(String(body.ymid), String(body.telegram_id||""), String(body.content_id), Date.now()).run();
        }
        return json({ok:true});
      } catch {
        return json({error:"bad request"},400);
      }
    }

    // Monetag server-side postback endpoint.
    if (path === "/postback" && request.method === "GET") {
      const q = url.searchParams;
      const ymid = q.get("ymid") || "";
      const event = q.get("event") || q.get("event_type") || "";
      const value = q.get("value") || q.get("reward_event_type") || "";
      const zone = q.get("zone") || q.get("zone_id") || "";
      const telegramId = q.get("telegram_id") || "";
      const price = Number(q.get("price") || q.get("estimated_price") || 0);
      const source = q.get("source") || q.get("request_var") || "";

      if (env.DB && ymid) {
        await env.DB.prepare(
          "INSERT INTO postbacks (ymid,event_type,reward_event_type,zone_id,telegram_id,estimated_price,request_var,received_at) VALUES (?,?,?,?,?,?,?,?)"
        ).bind(ymid,event,value,zone,telegramId,price,source,Date.now()).run();

        // Only verified/valued rewarded events should be marked as monetized.
        if (value === "valued") {
          await env.DB.prepare(
            "UPDATE ad_sessions SET verified=1,reward_event_type=?,estimated_price=? WHERE ymid=?"
          ).bind(value,price,ymid).run();
        }
      }
      return new Response("OK");
    }

    if (path === "/telegram/webhook" && request.method === "POST") {
      return telegramWebhook(request, env);
    }

    // Admin endpoints are intentionally not exposed until authentication is configured.
    return env.ASSETS.fetch(request);
  }
};

function cors(){
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...cors()}});
}
async function getContent(env){
  if(!env.DB) return [];
  const {results}=await env.DB.prepare(
    "SELECT id,title,description,preview_url,category FROM content WHERE active=1 ORDER BY created_at DESC LIMIT 100"
  ).all();
  return results||[];
}
async function telegramWebhook(request,env){
  if(!env.TELEGRAM_BOT_TOKEN) return new Response("Bot token not configured",500);
  const update=await request.json();
  const msg=update.message;
  if(!msg?.chat?.id) return new Response("OK");
  const text=msg.text||"";
  if(text.startsWith("/start")){
    const webUrl=env.MINI_APP_URL || new URL(request.url).origin;
    await telegramSend(env.TELEGRAM_BOT_TOKEN,"sendMessage",{
      chat_id:msg.chat.id,
      text:"🎬 Welcome to Next Video Tube!\\n\\nOpen the Mini App:",
      reply_markup:{inline_keyboard:[[{text:"🚀 Open Next Video Tube",web_app:{url:webUrl}}]]}
    });
  }
  return new Response("OK");
}
async function telegramSend(token,method,body){
  return fetch(`https://api.telegram.org/bot${token}/${method}`,{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)
  });
}
