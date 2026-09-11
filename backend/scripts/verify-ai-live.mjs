// Optional smoke test: uses the server's configured model and may incur API charges.
// Creates and deletes only its own unique test account. Never prints tokens or API keys.
import { randomUUID } from 'node:crypto';

const base = process.env.API_BASE_URL || 'http://localhost:3001';
const email = `ai-live-${randomUUID()}@example.com`;
const password = `AiSmoke9-${randomUUID()}`;
let token;
let userId;
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
    ...(body ? {body:JSON.stringify(body)} : {}),
    signal: AbortSignal.timeout(75000),
  });
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
try {
  userId = (await call('/api/auth/signup','POST',{email,password,confirmPassword:password})).data.id;
  token = (await call('/api/auth/login','POST',{email,password})).data.accessToken;
  const session = await call('/api/ai-agent/sessions','POST',{});
  if (session.modelProvider === 'mock') throw new Error('Configure a real default model before running this optional test');
  const started = Date.now();
  const result = await call('/api/ai-agent/chat','POST',{
    sessionId:session.id,
    message:'请根据工具提供的数据，用中文一句话回答公司总数，不要补充其他内容。',
    companyQuery:{dimension:'level',filter:{}},
  });
  const loaded = await call(`/api/ai-agent/sessions/${session.id}`);
  if (!result.toolResult?.data || loaded.messages.length !== 2) throw new Error('Tool result or persisted history is missing');
  console.log(JSON.stringify({provider:result.provider,model:result.model,reply:result.assistantMessage.content.text,historyMessages:loaded.messages.length,toolVerified:true,elapsedMs:Date.now()-started}));
  await call(`/api/ai-agent/sessions/${session.id}`,'DELETE');
} finally {
  if (token && userId) await call(`/api/users/${userId}`,'DELETE');
}
