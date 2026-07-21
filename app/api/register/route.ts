import { env } from "cloudflare:workers";

export async function POST(request:Request){
  try{
    const p=await request.json() as Record<string,string>;
    const name=(p.name||"").trim().replace(/[<>]/g,"");
    const studentNumber=(p.studentNumber||"").trim();
    const email=(p.email||"").trim().toLowerCase();
    if(p.company)return Response.json({error:"Invalid submission"},{status:400});
    if(name.length<2||name.length>100||!/^[\p{L}\p{M} .'-]+$/u.test(name))return Response.json({error:"Enter a valid full name."},{status:400});
    if(!/^\d{6,10}$/.test(studentNumber))return Response.json({error:"Enter a valid student number."},{status:400});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:"Enter a valid email address."},{status:400});
    const session=await env.DB.prepare("SELECT capacity,status,registration_deadline FROM training_sessions WHERE id=?").bind(p.sessionId).first<{capacity:number;status:string;registration_deadline:string|null}>();
    if(!session||session.status!=="available")return Response.json({error:"This session is not accepting registrations."},{status:409});
    const count=await env.DB.prepare("SELECT COUNT(*) AS count FROM registrations WHERE session_id=? AND status='confirmed'").bind(p.sessionId).first<{count:number}>();
    if(Number(count?.count||0)>=session.capacity)return Response.json({error:"This session is full."},{status:409});
    const id=crypto.randomUUID();const ref=`PRG-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;const now=new Date().toISOString();
    await env.DB.prepare("INSERT INTO registrations (id,session_id,full_name,student_number,email,booking_reference,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,p.sessionId,name,studentNumber,email||null,ref,"confirmed",now,now).run();
    return Response.json({reference:ref},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"Registration failed";
    if(message.includes("UNIQUE"))return Response.json({error:"This student number is already registered for this session."},{status:409});
    return Response.json({error:"Registration could not be completed. Please try again."},{status:500});
  }
}
