import express from 'express';
import cors from 'cors';
import MarkdownIt from 'markdown-it';
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
const md = new MarkdownIt();
app.post('/report', (req, res) => {
const { summaryText, structured } = req.body || {};
if (!summaryText) {
return res.status(400).json({ ok: false, error: 'summaryText is 
required' });
}
const mdDoc = `# Terraform Infrastructure Report\n\n## Summary\n\n$
{summaryText}\n\n---\n\n## Key Resources (Structured)\n\n\n\n\n> This section 
lists the parsed resources for reference.\n\n` +
(structured ? `\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n` +
'````json\n' + JSON.stringify(structured, null, 2) + '\n````' : '');
const html = md.render(mdDoc);
return res.json({ ok: true, markdown: mdDoc, html });
});
app.get('/', (_req, res) => {
res.json({ service: 'report', status: 'ok' });
});
const PORT = process.env.PORT || 8003;
app.listen(PORT, () => console.log(`Report service listening on ${PORT}`));
