const express=require('express');const axios=require('axios');const OpenAI=require('openai');
const app=express();app.use(express.json());
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
const PAYSTACK_SECRET=process.env.PAYSTACK_SECRET_KEY;
const MAP={"BEAUTY_001":"ACCT_xxx","FOOD_002":"ACCT_xxx"};const MASTER="ACCT_xxx_salvageai";

app.post('/power',async(req,res)=>{
  const {text}=req.body;
  const router=await openai.chat.completions.create({model:"gpt-4o-mini",response_format:{type:"json_object"},messages:[{role:"system",content:`Return JSON. If payment: {"type":"pay","amount":5000,"biz":"BEAUTY_001"} If image: {"type":"image","prompt":"a house"} If code: {"type":"code","prompt":"calculator"} Else: {"type":"chat"}`},{role:"user",content:text}]});
  const cmd=JSON.parse(router.choices[0].message.content);
  if(cmd.type==='chat'){const r=await openai.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"user",content:text}]});return res.json({type:'chat',answer:r.choices[0].message.content});}
  if(cmd.type==='image'){const r=await openai.images.generate({model:"dall-e-3",prompt:cmd.prompt,size:"1024x1024"});return res.json({type:'image',url:r.data[0].url});}
  if(cmd.type==='code'){const r=await openai.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"user",content:`Write code for: ${cmd.prompt}`}]});return res.json({type:'code',code:r.choices[0].message.content});}
  if(cmd.type==='pay'){const sub=MAP[cmd.biz];if(!sub)return res.json({type:'chat',answer:'Bad business code'});const r=await axios.post('https://api.paystack.co/transaction/initialize',{email:'guest@salvage.ai',amount:cmd.amount,currency:"GHS",subaccount:sub,transaction_charge:Math.round(cmd.amount*0.10),bearer:"subaccount"},{headers:{Authorization:`Bearer ${PAYSTACK_SECRET}`}});return res.json({type:'pay',url:r.data.authorization_url,amount:cmd.amount,biz:cmd.biz});}
});
app.listen(3000);