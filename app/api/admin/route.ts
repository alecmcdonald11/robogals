import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const ADMIN_EMAILS=new Set(["alecmcdonald11@gmail.com"]);
async function authorised(){const user=await getChatGPTUser();return user&&ADMIN_EMAILS.has(user.email.toLowerCase())?user:null}

export async function GET(){
  const user=await authorised();if(!user)return Response.json({error:"Unauthorised"},{status:401});
  const registrations=await env.DB.prepare("SELECT id,session_id AS sessionId,full_name AS name,student_number AS studentNumber,status FROM registrations ORDER BY created_at").all();
  return Response.json({user,registrations:registrations.results});
}

export async function POST(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  const p=await request.json() as Record<string,string|number>;
  const title=String(p.title||"").trim().replace(/[<>]/g,"");const location=String(p.location||"").trim().replace(/[<>]/g,"");const capacity=Number(p.capacity);
  if(!title||!location||!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date))||!/^\d{2}:\d{2}$/.test(String(p.start))||!/^\d{2}:\d{2}$/.test(String(p.end))||capacity<1||capacity>200)return Response.json({error:"Invalid session details"},{status:400});
  const id=crypto.randomUUID();const now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO training_sessions (id,title,description,session_date,start_time,end_time,location,capacity,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(id,title,String(p.description||"").trim().replace(/[<>]/g,""),p.date,p.start,p.end,location,capacity,"available",now,now).run();
  return Response.json({id},{status:201});
}

export async function DELETE(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"Missing session"},{status:400});
  await env.DB.prepare("DELETE FROM training_sessions WHERE id=?").bind(id).run();
  return Response.json({ok:true});
}
