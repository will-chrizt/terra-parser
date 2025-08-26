import express from 'express';
import cors from 'cors';
import AWS from 'aws-sdk';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Configure Bedrock client
const bedrock = new AWS.Bedrock({ region: 'us-east-1' });

app.post('/visualize-llm', async (req, res) => {
    const parsed = req.body.parsed;
    if (!parsed) return res.status(400).json({ ok: false, error: 'parsed JSON required' });

    // Prompt for the LLM
    const prompt = `
You are an expert cloud architect. Generate a Mermaid.js diagram for the following Terraform infrastructure JSON.

Rules:
- VPCs are top-level nodes.
- Subnets connect to their VPCs.
- Resources connect to their subnet or VPC.
- Modules are separate nodes.
- Do not include extra text. Return ONLY valid Mermaid.js code.

JSON:
${JSON.stringify(parsed, null, 2)}
`;

    try {
        const response = await bedrock.invokeModel({
            modelId: 'anthropic.claude-v2', // example LLM
            contentType: 'application/json',
            inputText: prompt
        }).promise();

        // Extract LLM output
        const mermaidCode = response.body?.toString() || '';
        res.json({ ok: true, mermaid: mermaidCode });
    } catch (err) {
        console.error('Bedrock LLM error:', err);
        res.status(500).json({ ok: false, error: 'Bedrock LLM failed' });
    }
});

app.get('/', (_req, res) => res.json({ service: 'visualizer-llm', status: 'ok' }));

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => console.log(`Visualizer (LLM) listening on ${PORT}`));
