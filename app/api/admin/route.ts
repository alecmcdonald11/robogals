import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const ADMIN_EMAILS=new Set(["alecmcdonald11@gmail.com","perth.training@robogals.org"]);
export async function authorised(){const user=await getChatGPTUser();return user&&ADMIN_EMAILS.has(user.email.toLowerCase())?user:null}

export async function GET(){
  const user=await authorised();if(!user)return Response.json({error:"Unauthorised"},{status:401});
  const completions=await env.DB.prepare(`SELECT c.id,c.module_id AS moduleId,m.title AS moduleTitle,c.full_name AS name,c.student_number AS studentNumber,c.completed_at AS completedAt FROM module_completions c JOIN training_modules m ON m.id=c.module_id ORDER BY c.completed_at DESC`).all();
  return Response.json({user,completions:completions.results},{headers:{"Cache-Control":"no-store"}});
}
