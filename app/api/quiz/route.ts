import { env } from "cloudflare:workers";

function clean(value:unknown,max=120){return String(value||"").trim().replace(/[<>]/g,"").slice(0,max)}

export async function POST(request:Request){
  try{
    const p=await request.json() as {moduleId?:string;questionId?:string;answers?:string[];name?:string;studentNumber?:string};
    const moduleId=clean(p.moduleId,80),questionId=clean(p.questionId,80),name=clean(p.name),studentNumber=clean(p.studentNumber,20);
    if(name.length<2||!/^\d{6,10}$/.test(studentNumber)||!Array.isArray(p.answers))return Response.json({error:"Invalid submission."},{status:400});
    const row=await env.DB.prepare("SELECT correct_json AS correctJson FROM module_questions WHERE id=? AND module_id=?").bind(questionId,moduleId).first<{correctJson:string}>();
    if(!row)return Response.json({error:"Question not found."},{status:404});
    const expected=(JSON.parse(row.correctJson) as string[]).sort();const actual=[...new Set(p.answers.map(String))].sort();
    const correct=expected.length===actual.length&&expected.every((x,i)=>x===actual[i]);
    if(!correct)return Response.json({correct:false,completed:false});
    const now=new Date().toISOString();
    await env.DB.prepare("INSERT INTO module_progress (id,module_id,question_id,student_number,full_name,answered_at) VALUES (?,?,?,?,?,?) ON CONFLICT(module_id,student_number,question_id) DO UPDATE SET full_name=excluded.full_name,answered_at=excluded.answered_at").bind(crypto.randomUUID(),moduleId,questionId,studentNumber,name,now).run();
    const counts=await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM module_questions WHERE module_id=?) AS total,(SELECT COUNT(*) FROM module_progress WHERE module_id=? AND student_number=?) AS answered`).bind(moduleId,moduleId,studentNumber).first<{total:number;answered:number}>();
    const completed=Number(counts?.total||0)>0&&Number(counts?.answered||0)>=Number(counts?.total||0);
    if(completed)await env.DB.prepare("INSERT INTO module_completions (id,module_id,student_number,full_name,completed_at) VALUES (?,?,?,?,?) ON CONFLICT(module_id,student_number) DO UPDATE SET full_name=excluded.full_name").bind(crypto.randomUUID(),moduleId,studentNumber,name,now).run();
    return Response.json({correct:true,completed});
  }catch(error){console.error("quiz",error);return Response.json({error:"Unable to check this answer."},{status:500})}
}
