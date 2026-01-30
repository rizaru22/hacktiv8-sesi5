import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app=express();
const port=process.env.PORT || 3000;
const GEMINI_MODEL = 'gemini-2.5-flash-lite'

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
    console.warn('GEMINI_API_KEY not set — running in mock mode (no external API calls).');
}


app.use(cors());
app.use(express.json());

app.get('/',async(req,res)=>{
    res.send('Hello World');
    });


app.post('/api/chat',async(req,res)=>{
    try{
        const conversation=req.body.conversation;
        if (Array.isArray(conversation)===false){
            return res.status(400).json({
                error:'Bad Request',
                message:'Conversation must be an array'
            });
            
        }

        // If no API key / ai instance, return a mock reply so server stays up
        if (!ai) {
            const lastUser = conversation.slice().reverse().find(m => m.role === 'user')?.text || 'Halo';
            const botReply = `Mock reply (no API key): ${lastUser}`;
            return res.status(200).json({ result: botReply });
        }

   const contents = conversation.map(({ role, text }) => ({
    role,
    parts: [{ text: String(text) }]
}));


        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: 'Jawab hanya menggunakan bahasa Indonesia.'
            },
        });

        let botReply = null;
        if (response) {
            botReply = response?.output?.[0]?.content?.[0]?.text
                || response?.candidates?.[0]?.content?.[0]?.text
                || response?.text;
        }
        if (!botReply) botReply = JSON.stringify(response);

        res.status(200).json({ result: botReply });
    }catch(error){
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});  
    }
});    
app.listen(port,()=>{
    console.log(
        `Server is running on http://localhost:${port}`

    );
});

