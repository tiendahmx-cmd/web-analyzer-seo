import { Request, Response } from 'express';
import OpenAI from 'openai';
import { db } from '../db';
import { randomUUID } from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const analyzeAndGenerateForWP = async (req: Request, res: Response) => {
  const { url, title, content, focusKeyword, websiteId } = req.body;
  const licenseToken = req.headers['x-license-token'] as string;

  try {
    if (!licenseToken) return res.status(401).json({ error: 'Token no proporcionado.' });
    
    // Buscar usuario con better-sqlite3
    const user = db.prepare('SELECT * FROM User WHERE licenseToken = ? AND subscriptionStatus = ?').get(licenseToken, 'active') as any;
    if (!user) return res.status(403).json({ error: 'Suscripción inactiva.' });

    const issuesPrompt = `Actúa como auditor SEO. Título: ${title}, Keyword: ${focusKeyword}, Contenido: ${content.substring(0, 2000)}. Genera JSON {"tasks": [{"title": "...", "aiSolution": "..."}]} enfocado en SEO y citabilidad IA.`;
    const issuesResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "Eres un experto SEO que responde JSON." }, { role: "user", content: issuesPrompt }],
    });
    const tasks = JSON.parse(issuesResponse.choices[0].message.content || '{"tasks": []}').tasks;

    // Guardar tareas con better-sqlite3
    if (tasks && tasks.length > 0) {
      const insert = db.prepare('INSERT INTO Task (id, websiteId, title, aiSolution, status, scheduledCheck) VALUES (?, ?, ?, ?, ?, ?)');
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      tasks.forEach((task: any) => {
        insert.run(randomUUID(), websiteId, task.title, task.aiSolution, 'pending', futureDate);
      });
    }

    const metaPrompt = `Genera JSON con seoTitle (50 chars), metaDescription (150 chars), slug para keyword: ${focusKeyword}.`;
    const metaResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "Eres un generador SEO JSON." }, { role: "user", content: metaPrompt }],
    });
    const metaSuggestions = JSON.parse(metaResponse.choices[0].message.content || '{}');

    res.status(200).json({ success: true, tasks, metaSuggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
