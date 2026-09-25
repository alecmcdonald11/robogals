import { env } from "cloudflare:workers";
import { authorised } from "../route";

type Draft={prompt:string;type:"single"|"multiple";options:string[];correct:number[]};
const VIDEO_TYPES=new Set(["video/mp4","video/webm"]);
const IMAGE_TYPES=new Set(["image/png","image/jpeg","image/webp"]);
function clean(value:unknown,max=500){return String(value||"").trim().replace(/[<>]/g,"").slice(0,max)}
function extension(file:File){const byType:Record<string,string>={"video/mp4":"mp4","video/webm":"webm","image/png":"png","image/jpeg":"jpg","image/webp":"webp"};return byType[file.type]||"bin"}

export async function POST(request:Request){
  if(!await authorised())return Response.json({error:"Unauthorised"},{status:401});
  try{
    const form=await request.formData();const title=clean(form.get("title"),120);const description=clean(form.get("description"),1000);const video=form.get("video");
    if(!title||!description||!(video instanceof File)||!VIDEO_TYPES.has(video.type)||video.size===0||video.size>100*1024*1024)return Response.json({error:"Add a title, description and an MP4 or WebM video under 100 MB."},{status:400});
    let drafts:Draft[];try{drafts=JSON.parse(String(form.get("questions")||"[]"))}catch{return Response.json({error:"The questionnaire could not be read."},{status:400})}
    if(!Array.isArray(drafts)||drafts.length<1||drafts.length>50)return Response.json({error:"Add between 1 and 50 questions."},{status:400});
    for(const q of drafts){
      if(!q||!["single","multiple"].includes(q.type)||clean(q.prompt).length<2||!Array.isArray(q.options)||q.options.length<2||q.options.length>10||q.options.some(o=>clean(o,250).length<1)||!Array.isArray(q.correct)||q.correct.length<1||q.correct.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))return Response.json({error:"Every question needs at least two answers and one marked correct answer."},{status:400});
      if(q.type==="single"&&q.correct.length!==1)return Response.json({error:"Multiple choice questions must have one correct answer."},{status:400});
    }
    const moduleId=crypto.randomUUID();const now=new Date().toISOString();const videoKey=`modules/${moduleId}/video.${extension(video)}`;
    await env.MEDIA.put(videoKey,await video.arrayBuffer(),{httpMetadata:{contentType:video.type}});
    const statements=[env.DB.prepare("INSERT INTO training_modules (id,title,description,video_key,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(moduleId,title,description,videoKey,"published",now,now)];
    for(let i=0;i<drafts.length;i++){
      const q=drafts[i];const options=q.options.map((label,index)=>({id:crypto.randomUUID(),label:clean(label,250),index}));const correct=options.filter(o=>q.correct.includes(o.index)).map(o=>o.id);const image=form.get(`questionImage${i}`);let imageKey:string|null=null;
      if(image instanceof File&&image.size>0){if(!IMAGE_TYPES.has(image.type)||image.size>8*1024*1024)return Response.json({error:`Question ${i+1} image must be PNG, JPEG or WebP under 8 MB.`},{status:400});imageKey=`modules/${moduleId}/question-${i+1}.${extension(image)}`;await env.MEDIA.put(imageKey,await image.arrayBuffer(),{httpMetadata:{contentType:image.type}})}
      statements.push(env.DB.prepare("INSERT INTO module_questions (id,module_id,prompt,question_type,options_json,correct_json,image_key,position,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),moduleId,clean(q.prompt),q.type,JSON.stringify(options.map(({id,label})=>({id,label}))),JSON.stringify(correct),imageKey,i+1,now));
    }
    await env.DB.batch(statements);return Response.json({id:moduleId},{status:201});
  }catch(error){console.error("create module",error);return Response.json({error:"The module could not be saved. Please try again."},{status:500})}
}
