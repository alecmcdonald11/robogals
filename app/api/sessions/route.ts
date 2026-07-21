import { env } from "cloudflare:workers";

const seedSessions = [
  ["s1","Robotics Workshop Volunteer Induction","Get ready to inspire the next generation of engineers at Perth Robogals workshops.","2026-07-03","09:00","10:30","UWA EZONE · Learning Studio",18,"available"],
  ["s2","School Outreach Facilitator Training","Practical training for volunteers delivering engaging school outreach sessions.","2026-07-08","13:00","14:00","UWA EZONE · Flexi Room",12,"available"],
  ["s3","Robotics Workshop Volunteer Induction","Get ready to inspire the next generation of engineers at Perth Robogals workshops.","2026-07-08","15:00","16:30","UWA EZONE · Learning Studio",18,"available"],
  ["s4","Inclusive STEM Facilitation","Build confidence creating welcoming, inclusive and hands-on STEM experiences.","2026-07-14","10:00","11:30","Perth City · Community Lab",24,"available"],
  ["s5","Robotics Kit & Equipment Training","Hands-on practice with the robotics kits used in Perth Robogals workshops.","2026-07-21","11:00","12:30","UWA EZONE · Maker Space",10,"available"],
  ["s6","School Outreach Facilitator Training","Registrations closed at the published deadline.","2026-07-26","14:00","15:00","UWA EZONE · Flexi Room",12,"closed"],
] as const;
const seedRegistrations = [
  ["r1","s1","Mia Thompson","23810471"],["r2","s1","Ethan Nguyen","24139508"],["r3","s1","Aisha Rahman","22970416"],
  ["r4","s2","Sophie Williams","23765012"],["r5","s2","Noah Chen","24381790"],["r6","s4","Grace Patel","23184605"],["r7","s5","Liam Martin","24017653"],
] as const;

export async function ensureSeeded(){
  const count=await env.DB.prepare("SELECT COUNT(*) AS count FROM training_sessions").first<{count:number}>();
  if(Number(count?.count||0)>0)return;
  const now=new Date().toISOString();
  await env.DB.batch(seedSessions.map(s=>env.DB.prepare("INSERT INTO training_sessions (id,title,description,session_date,start_time,end_time,location,capacity,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(...s.slice(0,8),s[8],now,now)));
  await env.DB.batch(seedRegistrations.map(r=>env.DB.prepare("INSERT INTO registrations (id,session_id,full_name,student_number,booking_reference,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(r[0],r[1],r[2],r[3],`TEST-${r[0].toUpperCase()}`,"confirmed",now,now)));
}

export async function GET(){
  try{
    await ensureSeeded();
    const result=await env.DB.prepare(`SELECT s.id,s.title,s.description,s.session_date AS date,s.start_time AS start,s.end_time AS end,s.location,s.capacity,s.status,COUNT(CASE WHEN r.status='confirmed' THEN 1 END) AS booked FROM training_sessions s LEFT JOIN registrations r ON r.session_id=s.id GROUP BY s.id ORDER BY s.session_date,s.start_time`).all();
    return Response.json({sessions:result.results},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to load sessions"},{status:500})}
}
