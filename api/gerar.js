export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    
    const { ingredientes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Chave API não configurada na Vercel.' });

    // Pedimos para a IA retornar um objeto JSON perfeito, como num app de verdade.
    const prompt = `
    Você é um chef de cozinha profissional e inovador. O usuário tem estes ingredientes: ${ingredientes}.
    Crie uma receita maravilhosa.
    
    REGRA CRUCIAL: Retorne APENAS um objeto JSON válido, sem texto antes ou depois, sem blocos de código Markdown. Use exatamente esta estrutura:
    {
      "titulo": "Nome Criativo",
      "tempo": "ex: 20 min",
      "dificuldade": "Fácil, Média ou Difícil",
      "ingredientes": ["quantidade e item 1", "quantidade e item 2"],
      "passos": ["primeiro passo...", "segundo passo..."],
      "dica": "Dica de ouro do chef"
    }
    `;

    try {
        // Atualizado para o modelo mais recente e estável para evitar o erro 404
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        // Limpando a resposta da IA para garantir que é um JSON puro
        let texto = data.candidates[0].content.parts[0].text;
        texto = texto.replace(/```json/g, '').replace(/```/g, '').trim();

        const receitaJson = JSON.parse(texto);
        res.status(200).json(receitaJson);

    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ error: error.message });
    }
}
