const WebSocket=require('ws'),tls=require('tls'),extractJson=require('extract-json-string'),fs=require('fs');
const config={token:"",serverid:""}; //SERVER ID AND TOKEN
let guilds={},lastSeq=null,hbInterval=null,mfaToken=null,mfaTokenLastChecked=0,lastMfaFileTime=0;

function safeExtract(d){if(typeof d!=='string')try{return JSON.stringify(d)}catch(e){return null}try{return extractJson.extract(d)}catch(e){return null}}
function readMfaToken(force=false){const now=Date.now();try{const stats=fs.statSync('mfatoken.json');if(mfaToken&&stats.mtimeMs<=lastMfaFileTime&&!force)return mfaToken;lastMfaFileTime=stats.mtimeMs;const data=fs.readFileSync('mfatoken.json','utf8');const tokenData=JSON.parse(data);if(tokenData&&tokenData.token){if(tokenData.token!==mfaToken){mfaToken=tokenData.token;console.log(`MFA: ${mfaToken}`);}else{mfaToken=tokenData.token;}mfaTokenLastChecked=now;return mfaToken;}}catch(e){}return mfaToken;}

async function req(m, p, b=null) {
  return new Promise(r => {
    const s = tls.connect({host:'canary.discord.com',port:443,rejectUnauthorized:false}, () => {
      const h = [
        `${m} ${p} HTTP/1.1`,
        'Host: canary.discord.com',
        `Authorization: ${config.token}`,
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0`,
        `X-Super-Properties: eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRmlyZWZveCIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJ0ci1UUiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQ7IHJ2OjEzMy4wKSBHZWNrby8yMDEwMDEwMSBGaXJlZm94LzEzMy4wIiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTMzLjAiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJjYW5hcnkiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNTYxNDAsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImhhc19jbGllbnRfbW9kcyI6ZmFsc2V9`
      ];
      
      if(mfaToken) h.push(`X-Discord-MFA-Authorization: ${mfaToken}`);
      if(b) h.push('Content-Type: application/json', `Content-Length: ${Buffer.byteLength(b)}`);
      h.push('Connection: close', '', b || '');
      s.write(h.join('\r\n'));
      
      let d = ''; s.on('data', c => d += c.toString());
      s.on('end', () => {
        const i = d.indexOf('\r\n\r\n'); if(i === -1) { r('{}'); return s.destroy(); }
        let body = d.slice(i + 4);
        if(d.toLowerCase().includes('transfer-encoding: chunked')) {
          let res = '', o = 0;
          while(o < body.length) {
            const e = body.indexOf('\r\n', o); if(e === -1) break;
            const z = parseInt(body.substring(o, e), 16); if(z === 0) break;
            res += body.substring(e + 2, e + 2 + z); o = e + 2 + z + 2;
          }
          body = res || '{}';
        }
        if(!p.includes('/vanity-url')) { const ext = safeExtract(body); if(ext) { r(ext); return s.destroy(); } }
        r(body); s.destroy();
      });
      s.on('error', () => { r('{}'); s.destroy(); });
    });
    s.setTimeout(1000, () => { r('{}'); s.destroy(); });
  });
}

function connect() {
  req("GET", "/api/v9/gateway").then(res => {
    let url; try { url = JSON.parse(res)?.url; } catch(e) { const ext = safeExtract(res); if(ext) try { url = JSON.parse(ext)?.url; } catch(e) {} }
    const ws = new WebSocket(url || "wss://gateway.discord.gg/?v=9&encoding=json");
    
    ws.on("open", () => ws.send(JSON.stringify({op: 2, d: {token: config.token, intents: 513, properties: {os: "Windows", browser: "Discord.js", device: "Desktop"}}})));
    

    ws.on("message", async d => {
      try {
        let p; try { p = typeof d === 'string' ? JSON.parse(d) : JSON.parse(d.toString()); } catch(e) { const j = safeExtract(d.toString()); if(j) p = JSON.parse(j); else return; }
        if(p.s) lastSeq = p.s;
        if(p.op === 10) { clearInterval(hbInterval); hbInterval = setInterval(() => ws.send(JSON.stringify({op: 1, d: lastSeq})), p.d.heartbeat_interval); }
        
        if (p.t === "READY") {
          p.d.guilds.filter(g => g.vanity_url_code).forEach(g => {
            guilds[g.id] = g.vanity_url_code;
          });
          Object.entries(guilds).forEach(([id, url]) => {
            console.log(`${id}: ${url}`);
          });
        }
        
        
        if(p.t === "GUILD_UPDATE") {
          const id = p.d.id || p.d.guild_id, old = guilds[id], nw = p.d.vanity_url_code;
          if(old && old !== nw) {
            readMfaToken();
            if(mfaToken) {
              const req1 = req("PATCH", `/api/v9/guilds/${config.serverid}/vanity-url`, JSON.stringify({code: old}));
              const req2 = req("PATCH", `/api/v9/guilds/${config.serverid}/vanity-url`, JSON.stringify({code: old}));
              const [r1, r2] = await Promise.all([req1, req2]);
              console.log(`${r1}`);
              console.log(`${r2}`);
            }
          }
          if(nw) guilds[id] = nw; else if(guilds[id]) delete guilds[id];
        }
      } catch(e) {}
    });
    
    ws.on("close", () => { clearInterval(hbInterval); setTimeout(connect, 5000); });
    ws.on("error", () => ws.close());
  }).catch(() => setTimeout(connect, 5000));
}

(async()=>{readMfaToken(true);connect();setInterval(()=>readMfaToken(false),30000);})();
process.on('uncaughtException',()=>{});