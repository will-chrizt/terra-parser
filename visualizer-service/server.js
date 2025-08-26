import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
function generateMermaid(parsed) {
let diagram = 'graph TD\n';
if(parsed.resource) {
for(const [rtype, instances] of Object.entries(parsed.resource)) {
for(const [name, cfg] of Object.entries(instances)) {
diagram += ` ${rtype}_${name}["${rtype} : ${name}"]\n`;
}
}
}
if(parsed.module) {
for(const [modName, cfg] of Object.entries(parsed.module)) {
diagram += ` module_${modName}["Module: ${modName}"]\n`;
}
}
return diagram;
}
app.post('/visualize', (req, res) => {
const parsed = req.body.parsed;
if(!parsed) return res.status(400).json({ok:false, error:'parsed JSON required'});
const mermaidCode = generateMermaid(parsed);
res.json({ok:true, mermaid: mermaidCode});
});
app.get('/', (_req,res)=>res.json({service:'visualizer',status:'ok'}));
const PORT = process.env.PORT || 8002;
app.listen(PORT, () => console.log(`Visualizer service listening on ${PORT}`));
