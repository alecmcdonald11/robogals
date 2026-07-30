import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const ADMIN_EMAILS=new Set([
  "alecmcdonald11@gmail.com",
  "perth.training@robogals.org",
]);
async function authorised(){const user=await getChatGPTUser();return user&&ADMIN_EMAILS.has(user.email.toLowerCase())?user:null}

export async function GET(){
  const user=await authorised();if(!user)return Response.json({error:"Unauthorised"},{status:401});
  const [registrations,trained]=await Promise.all([
    env.DB.prepare("SELECT id,session_id AS sessionId,full_name AS name,student_number AS studentNumber,email,status FROM registrations ORDER BY created_at").all(),
    env.DB.prepare("SELECT id,session_id AS sessionId,training_title AS trainingTitle,full_name AS name,student_number AS studentNumber,email,marked_at AS markedAt FROM trained_volunteers ORDER BY training_title,full_name").all(),
  ]);
  return Response.json({user,registrations:registrations.results,trained:trained.results});
}

export async function POST(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  const p=await request.json() as Record<string,string|number>;
  const title=String(p.title||"").trim().replace(/[<>]/g,"");const location=String(p.location||"").trim().replace(/[<>]/g,"");const capacity=Number(p.capacity);const sessionType=String(p.type||"").toLowerCase();
  if(!["training","workshop"].includes(sessionType)||!title||!location||!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date))||!/^\d{2}:\d{2}$/.test(String(p.start))||!/^\d{2}:\d{2}$/.test(String(p.end))||capacity<1||capacity>200)return Response.json({error:"Invalid session details"},{status:400});
  const id=crypto.randomUUID();const now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO training_sessions (id,title,session_type,description,session_date,start_time,end_time,location,capacity,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,title,sessionType,String(p.description||"").trim().replace(/[<>]/g,""),p.date,p.start,p.end,location,capacity,"available",now,now).run();
  return Response.json({id},{status:201});
}

function perthNow(){const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Perth",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${v.year}-${v.month}-${v.day}`,time:`${v.hour}:${v.minute}`}}

export async function PATCH(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  const p=await request.json() as {sessionId?:string;registrationId?:string;present?:boolean};
  const row=await env.DB.prepare(`SELECT s.id AS sessionId,s.title,s.session_type AS type,s.session_date AS date,s.start_time AS start,s.end_time AS end,r.full_name AS name,r.student_number AS studentNumber,r.email FROM training_sessions s JOIN registrations r ON r.session_id=s.id WHERE s.id=? AND r.id=? AND r.status='confirmed'`).bind(p.sessionId,p.registrationId).first<Record<string,string|null>>();
  if(!row)return Response.json({error:"Registration not found"},{status:404});
  const now=perthNow();if(row.type!=="training"||row.date!==now.date||now.time<row.start!||now.time>row.end!)return Response.json({error:"Attendance can only be marked while a training session is in progress."},{status:409});
  if(p.present){await env.DB.prepare("INSERT INTO trained_volunteers (id,session_id,training_title,full_name,student_number,email,marked_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(session_id,student_number) DO UPDATE SET full_name=excluded.full_name,email=excluded.email,marked_at=excluded.marked_at").bind(crypto.randomUUID(),row.sessionId,row.title,row.name,row.studentNumber,row.email,new Date().toISOString()).run()}
  else await env.DB.prepare("DELETE FROM trained_volunteers WHERE session_id=? AND student_number=?").bind(row.sessionId,row.studentNumber).run();
  return Response.json({ok:true});
}

export async function DELETE(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"Missing session"},{status:400});
  await env.DB.prepare("DELETE FROM training_sessions WHERE id=?").bind(id).run();
  return Response.json({ok:true});
}
