import { env } from "cloudflare:workers";

type Option={id:string;label:string};
function clean(value:unknown,max=120){return String(value||"").trim().replace(/[<>]/g,"").slice(0,max)}
function validStudent(value:string){return /^\d{6,10}$/.test(value)}

export async function GET(){
  try{
    const result=await env.DB.prepare(`SELECT m.id,m.title,m.description,m.video_key AS videoKey,m.status,COUNT(DISTINCT q.id) AS questionCount,COUNT(DISTINCT c.id) AS completionCount FROM training_modules m LEFT JOIN module_questions q ON q.module_id=m.id LEFT JOIN module_completions c ON c.module_id=m.id WHERE m.status='published' GROUP BY m.id ORDER BY m.created_at`).all();
    return Response.json({modules:result.results},{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("modules",error);return Response.json({error:"Training modules are temporarily unavailable."},{status:500})}
}

export async function POST(request:Request){
  try{
    const p=await request.json() as Record<string,unknown>;const moduleId=clean(p.moduleId,80);const name=clean(p.name);const studentNumber=clean(p.studentNumber,20);
    if(name.length<2||!validStudent(studentNumber))return Response.json({error:"Enter your full name and a valid 6–10 digit student number."},{status:400});
    const module=await env.DB.prepare("SELECT id FROM training_modules WHERE id=? AND status='published'").bind(moduleId).first();
    if(!module)return Response.json({error:"This module is not available."},{status:404});
    const complete=await env.DB.prepare("SELECT id FROM module_completions WHERE module_id=? AND student_number=?").bind(moduleId,studentNumber).first();
    if(complete)return Response.json({completed:true});
    const result=await env.DB.prepare("SELECT id,prompt,question_type AS type,options_json AS optionsJson,image_key AS imageKey,position FROM module_questions WHERE module_id=? ORDER BY position").bind(moduleId).all<Record<string,unknown>>();
    const questions=result.results.map(q=>({id:q.id,prompt:q.prompt,type:q.type,options:JSON.parse(String(q.optionsJson)) as Option[],imageKey:q.imageKey,position:q.position}));
    return Response.json({completed:false,questions});
  }catch(error){console.error("module start",error);return Response.json({error:"Unable to start this module."},{status:500})}
}
