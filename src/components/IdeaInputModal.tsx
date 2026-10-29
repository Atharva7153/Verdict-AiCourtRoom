"use client";
import React, { useState } from "react";
import { X, Scale, Sparkles, LoaderCircle } from "lucide-react";
import { IdeaCase } from "@/app/api/court/route";

interface Props { isOpen:boolean; onClose:()=>void; onSubmitIdea:(data:IdeaCase)=>void; isLoading:boolean; error?:string|null; retryWait?:number; }
export default function IdeaInputModal({isOpen,onClose,onSubmitIdea,isLoading,error,retryWait=0}:Props){
  const [form,setForm]=useState<IdeaCase>({idea:"",problem:"",solution:"",targetUsers:"",difference:"",track:"",techStack:"",buildTime:"24 hours",teamSkills:"",demoPlan:"",competitorNotes:""});
  if(!isOpen)return null;
  const update=(key:keyof IdeaCase,value:string)=>setForm(current=>({...current,[key]:value}));
  const input=(key:keyof IdeaCase,label:string,placeholder:string,area=false,required=false)=><label className={area?"field field-wide":"field"}><span>{label}{required&&<b> Required</b>}</span>{area?<textarea value={form[key]||""} onChange={e=>update(key,e.target.value)} placeholder={placeholder} rows={3} maxLength={key==="idea"?700:1200}/>:<input value={form[key]||""} onChange={e=>update(key,e.target.value)} placeholder={placeholder} maxLength={300}/>}</label>;
  return <div className="modal-scrim" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!isLoading)onClose()}}><section className="case-modal" role="dialog" aria-modal="true" aria-labelledby="filing-title">
    <header className="modal-header"><div><span className="eyebrow">The Supreme Court of Hackathons · Case filing</span><h2 id="filing-title">Put your idea on trial.</h2><p>Give the court the facts. Missing details stay marked as unknown.</p></div><button className="close-button" onClick={onClose} disabled={isLoading} aria-label="Close case form"><X/></button></header>
    <form onSubmit={e=>{e.preventDefault();onSubmitIdea(form)}}><div className="form-grid">
      {input("idea","Idea name or one-line concept","What are you building?",true,true)}
      {input("problem","Problem","What problem needs solving?",true)}{input("solution","Proposed solution","What will the product do?",true)}
      {input("targetUsers","Target user","Who has this problem?")}{input("difference","What makes it different?","Your sharpest differentiator")}
      {input("track","Hackathon theme or track","Open innovation, climate, etc.")}{input("techStack","Proposed stack","Tools you plan to use")}
      {input("buildTime","Time to build","e.g. 24 hours")}{input("teamSkills","Team size and skills","e.g. 3 people, React + ML")}
      {input("demoPlan","Demo plan","What can you show live?",true)}{input("competitorNotes","Competitor notes (optional)","Supplied observations only; no live research is performed.",true)}
    </div>{error&&<p className="error-banner" role="alert">{error}{retryWait>0&&<strong className="block mt-1">Retry available in {retryWait}s. A daily quota may require a longer wait.</strong>}</p>}<footer className="modal-footer"><span><Scale size={16}/> Unanswered fields are treated as uncertainty, never invented facts.</span><button className="submit-case" disabled={isLoading||retryWait>0||form.idea.trim().length<8}>{isLoading?<><LoaderCircle className="spin" size={17}/> Filing case…</>:retryWait>0?`Wait ${retryWait}s to retry`:<><Sparkles size={16}/> Call the court</>}</button></footer></form>
  </section></div>
}
