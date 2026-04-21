export default async function handler(req, res) {
    // Garante que só aceitamos pedidos corretos do nosso próprio site
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { ingredientes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // A Vercel vai injetar isso com segurança

    // O truque: Pedimos para a IA já devolver tudo formatado em HTML
    const prompt = `
    Aja como um chef de cozinha criativo, prático e simpático. 
    Eu tenho os seguintes ingredientes na geladeira: ${ingredientes}. 
    Você pode assumir que eu também tenho itens básicos de despensa (sal, pimenta, óleo, azeite, água, açúcar).
    Crie uma receita deliciosa usando o máximo possível do que eu informei, mas sem exigir ingredientes difíceis que eu não listei.
    
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
        // Envia o pedido para o Google Gemini (Modelo 1.5 Flash - Rápido e gratuito)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // Pega apenas o texto da receita gerada
        let receitaHtml = data.candidates[0].content.parts[0].text;
        
        // Limpa possíveis formatações markdown que a IA possa tentar incluir por hábito
        receitaHtml = receitaHtml.replace(/```html/g, '').replace(/```/g, '');

        res.status(200).json({ receita: receitaHtml });
    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ error: 'Falha ao comunicar com a inteligência artificial.' });
    }
}
