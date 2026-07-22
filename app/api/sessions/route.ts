import { env } from "cloudflare:workers";

export async function GET(){
  try{
    const result=await env.DB.prepare(`SELECT s.id,s.title,s.session_type AS type,s.description,s.session_date AS date,s.start_time AS start,s.end_time AS end,s.location,s.capacity,s.status,COUNT(CASE WHEN r.status='confirmed' THEN 1 END) AS booked FROM training_sessions s LEFT JOIN registrations r ON r.session_id=s.id GROUP BY s.id ORDER BY s.session_date,s.start_time`).all();
    return Response.json({sessions:result.results},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to load sessions"},{status:500})}
}
