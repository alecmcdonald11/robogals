"use client";

import { useEffect, useMemo, useState } from "react";

type Module = { id:string; title:string; description:string; videoKey:string; questionCount:number; completionCount:number; status:string };
type Question = { id:string; prompt:string; type:"single"|"multiple"; options:{id:string;label:string}[]; imageKey:string|null; position:number };
type Completion = { id:string; moduleId:string; moduleTitle:string; name:string; studentNumber:string; completedAt:string };
type DraftQuestion = { prompt:string; type:"single"|"multiple"; options:string[]; correct:number[]; image:File|null };

const emptyQuestion=():DraftQuestion=>({prompt:"",type:"single",options:["",""],correct:[],image:null});

export default function Home(){
  const [modules,setModules]=useState<Module[]>([]);
  const [view,setView]=useState<"modules"|"learn"|"admin">("modules");
  const [selected,setSelected]=useState<Module|null>(null);
  const [learner,setLearner]=useState({name:"",studentNumber:""});
  const [questions,setQuestions]=useState<Question[]>([]);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [answers,setAnswers]=useState<string[]>([]);
  const [feedback,setFeedback]=useState<""|"correct"|"incorrect">("");
  const [completed,setCompleted]=useState(false);
  const [alreadyCompleted,setAlreadyCompleted]=useState(false);
  const [admin,setAdmin]=useState(false);
  const [adminEmail,setAdminEmail]=useState("");
  const [completions,setCompletions]=useState<Completion[]>([]);
  const [showBuilder,setShowBuilder]=useState(false);
  const [draftQuestions,setDraftQuestions]=useState<DraftQuestion[]>([emptyQuestion()]);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  const [search,setSearch]=useState("");

  useEffect(()=>{if(new URLSearchParams(window.location.search).get("admin")==="1")setView("admin");void refresh();void refreshAdmin()},[]);
  async function refresh(){const r=await fetch("/api/modules",{cache:"no-store"});if(r.ok){const d=await r.json();setModules(d.modules||[])}}
  async function refreshAdmin(){const r=await fetch("/api/admin",{cache:"no-store"});if(r.ok){const d=await r.json();setAdmin(true);setAdminEmail(d.user.email);setCompletions(d.completions||[])}}

  async function beginModule(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setNotice("");setAlreadyCompleted(false);setCompleted(false);
    const r=await fetch("/api/modules",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:selected?.id,...learner})});
    const d=await r.json();if(!r.ok){setNotice(d.error||"Unable to start this module.");return}
    if(d.completed){setAlreadyCompleted(true);return}
    setQuestions(d.questions||[]);setQuestionIndex(0);setAnswers([]);setFeedback("");setView("learn");
  }
  function toggleAnswer(id:string,type:"single"|"multiple"){
    if(feedback==="correct")return;setFeedback("");
    setAnswers(a=>type==="single"?[id]:a.includes(id)?a.filter(x=>x!==id):[...a,id]);
  }
  async function checkAnswer(){
    const q=questions[questionIndex];if(!q||answers.length===0)return;
    const r=await fetch("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:selected?.id,questionId:q.id,answers,name:learner.name,studentNumber:learner.studentNumber})});
    const d=await r.json();if(!r.ok){setNotice(d.error||"Unable to check your answer.");return}
    if(!d.correct){setFeedback("incorrect");setAnswers([]);return}
    setFeedback("correct");
    if(d.completed){setCompleted(true);return}
    setTimeout(()=>{setQuestionIndex(i=>i+1);setAnswers([]);setFeedback("")},500);
  }
  function openModule(m:Module){setSelected(m);setLearner({name:"",studentNumber:""});setNotice("");setAlreadyCompleted(false)}
  function updateQuestion(index:number,change:Partial<DraftQuestion>){setDraftQuestions(q=>q.map((x,i)=>i===index?{...x,...change}:x))}
  function updateOption(qi:number,oi:number,value:string){setDraftQuestions(q=>q.map((x,i)=>i===qi?{...x,options:x.options.map((o,j)=>j===oi?value:o)}:x))}
  function toggleCorrect(qi:number,oi:number){setDraftQuestions(q=>q.map((x,i)=>i===qi?{...x,correct:x.type==="single"?[oi]:x.correct.includes(oi)?x.correct.filter(n=>n!==oi):[...x.correct,oi]}:x))}
  async function createModule(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setSaving(true);setNotice("");const form=new FormData(e.currentTarget);
    const questions=draftQuestions.map(q=>({prompt:q.prompt,type:q.type,options:q.options,correct:q.correct}));form.set("questions",JSON.stringify(questions));
    draftQuestions.forEach((q,i)=>{if(q.image)form.set(`questionImage${i}`,q.image)});
    const r=await fetch("/api/admin/modules",{method:"POST",body:form});const d=await r.json();setSaving(false);
    if(!r.ok){setNotice(d.error||"The module could not be created.");return}
    setShowBuilder(false);setDraftQuestions([emptyQuestion()]);await refresh();await refreshAdmin();
  }
  const filtered=useMemo(()=>completions.filter(c=>`${c.name} ${c.studentNumber} ${c.moduleTitle}`.toLowerCase().includes(search.toLowerCase())),[completions,search]);
  const current=questions[questionIndex];

  return <main>
    <header className="topbar"><button className="brand" onClick={()=>setView("modules")}><img src="/robogals-perth-logo.png" alt="Robogals Perth"/><span><b>Training Hub</b><small>Perth chapter</small></span></button><nav><button className={view==="modules"?"active":""} onClick={()=>setView("modules")}>Modules</button><button className={view==="admin"?"active":""} onClick={()=>setView("admin")}>Admin</button></nav></header>

    {view==="modules"&&<><section className="intro"><div><span className="eyebrow">VOLUNTEER ONBOARDING</span><h1>Learn the skills to lead great workshops.</h1><p>Complete each module at your own pace. Your progress is recorded using your name and student number.</p></div><div className="intro-mark"><b>{modules.length}</b><span>training modules</span></div></section><section className="module-wrap"><div className="section-heading"><div><span className="eyebrow">YOUR TRAINING</span><h2>Available modules</h2></div><p>Choose a module to watch its video and complete the knowledge check.</p></div><div className="module-grid">{modules.map((m,i)=><article className="module-card" key={m.id}><div className="module-number">{String(i+1).padStart(2,"0")}</div><div className="module-copy"><span className="module-meta">VIDEO · {m.questionCount} QUESTION{m.questionCount===1?"":"S"}</span><h3>{m.title}</h3><p>{m.description}</p></div><button className="primary" onClick={()=>openModule(m)}>Start module <span>→</span></button></article>)}{modules.length===0&&<div className="empty"><b>No modules are available yet.</b><span>The Perth training team is preparing your onboarding content.</span></div>}</div></section></>}

    {selected&&view==="modules"&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="dialog"><button className="close" onClick={()=>setSelected(null)} aria-label="Close">×</button><span className="eyebrow">BEFORE YOU BEGIN</span><h2>{selected.title}</h2><p>Enter your details so we can check whether you have completed this module and record your result.</p>{alreadyCompleted?<div className="complete-box"><span>✓</span><div><b>Module already completed</b><p>Our records show that {learner.name} has already completed this training.</p></div></div>:<form onSubmit={beginModule}><label>Full name<input required value={learner.name} onChange={e=>setLearner({...learner,name:e.target.value})} minLength={2} autoComplete="name"/></label><label>Student number<input required value={learner.studentNumber} onChange={e=>setLearner({...learner,studentNumber:e.target.value})} pattern="[0-9]{6,10}" inputMode="numeric" placeholder="6–10 digits"/></label>{notice&&<p className="error">{notice}</p>}<button className="primary">Continue to module</button></form>}</section></div>}

    {view==="learn"&&selected&&<section className="learning"><div className="learn-head"><button className="back" onClick={()=>setView("modules")}>← Exit module</button><div><span>Module</span><b>{selected.title}</b></div><div className="progress"><span>{completed?questions.length:questionIndex} of {questions.length}</span><i><em style={{width:`${questions.length?((completed?questions.length:questionIndex)/questions.length)*100:0}%`}}/></i></div></div>{completed?<div className="finish"><div className="finish-icon">✓</div><span className="eyebrow">MODULE COMPLETE</span><h1>Nice work, {learner.name.split(" ")[0]}.</h1><p>Your completion of <b>{selected.title}</b> has been recorded.</p><button className="primary" onClick={()=>{setView("modules");setSelected(null);void refresh()}}>Return to modules</button></div>:<div className="lesson"><div className="video-panel"><div className="video-label"><span>Training video</span><small>Watch before answering the questions</small></div><video controls preload="metadata" src={`/api/media?key=${encodeURIComponent(selected.videoKey)}`}/></div>{current?<div className="question-panel"><div className="question-top"><span>Question {questionIndex+1} of {questions.length}</span><small>{current.type==="multiple"?"Select all that apply":"Choose one answer"}</small></div>{current.imageKey&&<img className="question-image" src={`/api/media?key=${encodeURIComponent(current.imageKey)}`} alt="Question reference"/>}<h2>{current.prompt}</h2><div className="answers">{current.options.map((o,i)=><button className={answers.includes(o.id)?"selected":""} key={o.id} onClick={()=>toggleAnswer(o.id,current.type)}><span>{current.type==="multiple"?(answers.includes(o.id)?"✓":"") : String.fromCharCode(65+i)}</span>{o.label}</button>)}</div>{feedback==="incorrect"&&<div className="feedback wrong"><b>Not quite.</b> Review the video and try again.</div>}{feedback==="correct"&&<div className="feedback right"><b>Correct.</b> Moving to the next question…</div>}<button className="primary answer-submit" disabled={!answers.length||feedback==="correct"} onClick={checkAnswer}>{questionIndex===questions.length-1?"Submit answer":"Check answer"}</button></div>:<div className="empty"><b>This module has no questions yet.</b></div>}</div>}</section>}

    {view==="admin"&&!admin&&<section className="admin-login"><div><span className="eyebrow">ROBOGALS TEAM ACCESS</span><h1>Administrator dashboard</h1><p>Sign in with an authorised ChatGPT account to create modules and review volunteer progress.</p><a className="primary" href="/signin-with-chatgpt?return_to=%2F%3Fadmin%3D1" target="_top">Sign in securely with ChatGPT</a></div></section>}

    {view==="admin"&&admin&&<section className="admin"><div className="admin-title"><div><span className="eyebrow">ADMINISTRATION</span><h1>Training overview</h1><p>Signed in as {adminEmail}</p></div><button className="primary" onClick={()=>setShowBuilder(true)}>＋ New training module</button></div><div className="stats"><article><span>Published modules</span><b>{modules.length}</b></article><article><span>Module completions</span><b>{completions.length}</b></article><article><span>Active volunteers</span><b>{new Set(completions.map(c=>c.studentNumber)).size}</b></article></div><section className="records"><div className="records-head"><div><h2>Volunteer training record</h2><p>Name, student number and completed modules.</p></div><div><input aria-label="Search training records" placeholder="Search records" value={search} onChange={e=>setSearch(e.target.value)}/><a className="secondary" href="/api/admin/report">Download CSV</a></div></div><div className="table-scroll"><table><thead><tr><th>Name</th><th>Student number</th><th>Completed module</th><th>Date completed</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.studentNumber}</td><td>{c.moduleTitle}</td><td>{new Date(c.completedAt).toLocaleDateString("en-AU")}</td></tr>)}{filtered.length===0&&<tr><td colSpan={4} className="table-empty">No completion records found.</td></tr>}</tbody></table></div></section></section>}

    {showBuilder&&<div className="overlay"><section className="dialog builder"><button className="close" onClick={()=>setShowBuilder(false)} aria-label="Close">×</button><span className="eyebrow">NEW TRAINING MODULE</span><h2>Build a module</h2><form onSubmit={createModule}><div className="form-grid"><label>Module title<input name="title" required placeholder="e.g. Robotics Fundamentals"/></label><label>Training video<input name="video" type="file" accept="video/mp4,video/webm" required/></label></div><label>Description<textarea name="description" required rows={3} placeholder="What volunteers will learn"/></label><div className="question-builder"><div className="builder-heading"><div><h3>Questionnaire</h3><p>Questions appear one at a time after the video.</p></div><button type="button" className="secondary" onClick={()=>setDraftQuestions(q=>[...q,emptyQuestion()])}>＋ Add question</button></div>{draftQuestions.map((q,qi)=><article className="question-editor" key={qi}><div className="editor-top"><b>Question {qi+1}</b>{draftQuestions.length>1&&<button type="button" onClick={()=>setDraftQuestions(x=>x.filter((_,i)=>i!==qi))}>Remove</button>}</div><label>Question<input required value={q.prompt} onChange={e=>updateQuestion(qi,{prompt:e.target.value})}/></label><div className="form-grid"><label>Answer type<select value={q.type} onChange={e=>updateQuestion(qi,{type:e.target.value as "single"|"multiple",correct:[]})}><option value="single">Multiple choice</option><option value="multiple">Select all that apply</option></select></label><label>Question image (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>updateQuestion(qi,{image:e.target.files?.[0]||null})}/></label></div><div className="option-list">{q.options.map((option,oi)=><div key={oi}><input type={q.type==="single"?"radio":"checkbox"} name={`correct-${qi}`} checked={q.correct.includes(oi)} onChange={()=>toggleCorrect(qi,oi)} aria-label={`Mark answer ${oi+1} correct`}/><input required value={option} onChange={e=>updateOption(qi,oi,e.target.value)} placeholder={`Answer ${oi+1}`}/>{q.options.length>2&&<button type="button" onClick={()=>updateQuestion(qi,{options:q.options.filter((_,i)=>i!==oi),correct:q.correct.filter(n=>n!==oi).map(n=>n>oi?n-1:n)})}>×</button>}</div>)}<button type="button" className="add-option" onClick={()=>updateQuestion(qi,{options:[...q.options,""]})}>＋ Add answer</button></div><small className="hint">Select the circle or checkbox beside every correct answer.</small></article>)}</div>{notice&&<p className="error">{notice}</p>}<div className="dialog-actions"><button type="button" className="secondary" onClick={()=>setShowBuilder(false)}>Cancel</button><button className="primary" disabled={saving}>{saving?"Uploading and saving…":"Publish module"}</button></div></form></section></div>}
    <footer><span>© {new Date().getFullYear()} Robogals Perth Asia Pacific</span><a href="mailto:perth.training@robogals.org">Training support</a></footer>
  </main>
}
