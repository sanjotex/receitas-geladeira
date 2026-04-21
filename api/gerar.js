export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    const { ingredientes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Verificação 1: A chave existe?
    if (!apiKey) {
        return res.status(500).json({ error: 'A chave da API (GEMINI_API_KEY) não foi encontrada nas configurações da Vercel.' });
    }

    const prompt = `
    Aja como um chef de cozinha criativo, prático e simpático. 
    Eu tenho os seguintes ingredientes na geladeira: ${ingredientes}. 
    Você pode assumir que eu também tenho itens básicos de despensa (sal, pimenta, óleo, azeite, água, açúcar).
    Crie uma receita deliciosa usando o máximo possível do que eu informei.
    
    Retorne a resposta EXATAMENTE no formato HTML abaixo, sem usar blocos de código Markdown (\`\`\`html):
    <h2>Nome Criativo da Receita</h2>
    <h3>Ingredientes:</h3>
    <ul>
      <li>...</li>
    </ul>
    <h3>Modo de Preparo:</h3>
    <ol>
      <li>...</li>
    </ol>
    <p><strong>Dica do Chef:</strong> ...</p>
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Verificação 2: A API do Google retornou algum erro?
        if (data.error) {
            console.error("Erro do Google:", data.error);
            return res.status(500).json({ error: `Erro do Google: ${data.error.message}` });
        }

        // Verificação 3: Tem conteúdo na resposta?
        if (!data.candidates || data.candidates.length === 0) {
            return res.status(500).json({ error: 'A IA não conseguiu gerar uma receita com esses ingredientes.' });
        }
        
        let receitaHtml = data.candidates[0].content.parts[0].text;
        receitaHtml = receitaHtml.replace(/```html/g, '').replace(/```/g, '');

        res.status(200).json({ receita: receitaHtml });
    } catch (error) {
        console.error("Erro no servidor Vercel:", error);
        res.status(500).json({ error: 'Falha grave ao tentar conectar com a Inteligência Artificial.' });
    }
}
