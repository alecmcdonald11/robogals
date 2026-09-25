import { env } from "cloudflare:workers";
import { authorised } from "../route";

function csv(value:unknown){return `"${String(value??"").replace(/"/g,'""')}"`}
export async function GET(){
  if(!await authorised())return new Response("Unauthorised",{status:401});
  const result=await env.DB.prepare(`SELECT c.full_name AS name,c.student_number AS studentNumber,m.title AS moduleTitle,c.completed_at AS completedAt FROM module_completions c JOIN training_modules m ON m.id=c.module_id ORDER BY c.full_name,m.title`).all<Record<string,unknown>>();
  const rows=["Name,Student number,Completed module,Completed at",...result.results.map(r=>[r.name,r.studentNumber,r.moduleTitle,r.completedAt].map(csv).join(","))];
  return new Response(rows.join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="robogals-training-completions.csv"',"Cache-Control":"no-store"}});
}
