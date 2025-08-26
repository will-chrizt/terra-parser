<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Terraform Infra Visualizer</title>
<script type="module" src="https://cdn.jsdelivr.net/npm/mermaid/dist/
mermaid.min.js"></script>
<style>
body { font-family:sans-serif; margin:2rem; }
textarea { width:100%; height:200px; }
.diagram { border:1px solid #ddd; padding:1rem; border-radius:8px; margin-top:
1rem; }
button { margin-top:0.5rem; padding:0.5rem 1rem; border-radius:4px; }
</style>
</head>
<body>
<h1>Terraform Infra Visualizer</h1>
<textarea id="tf"></textarea>
<div>
<button id="parseBtn">Parse</button>
<button id="demoBtn">Load Demo</button>
<button id="visualizeBtn">Visualize</button>
</div>
<pre id="parsed"></pre>
<div class="diagram" id="diagram"></div>
<script>
const parserURL = 'http://localhost:8001';
const vizURL = 'http://localhost:8002';
let parsedData = null;
document.getElementById('demoBtn').onclick = ()=>{
document.getElementById('tf').value=`provider "aws" { region = "us-east-1" }
resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }
resource "aws_subnet" "public" { vpc_id = aws_vpc.main.id 
cidr_block="10.0.1.0/24" }
`;
};
document.getElementById('parseBtn').onclick = async ()=>{
const tf = document.getElementById('tf').value;
const res = await fetch(`${parserURL}/parse-file`, { method:'POST', body: new
Blob([tf], {type:'text/plain'}) });
const data = await res.json();
parsedData = data.parsed;
document.getElementById('parsed').textContent =
JSON.stringify(parsedData,null,2);
};
document.getElementById('visualizeBtn').onclick = async ()=>{
if(!parsedData){ alert('Parse first'); return; }
const res = await fetch(`${vizURL}/visualize`, { method:'POST', headers:
{'Content-Type':'application/json'},
body:JSON.stringify({parsed:parsedData}) });
const data = await res.json();
if(data.ok){
document.getElementById('diagram').innerHTML=`<div class="mermaid">$
{data.mermaid}</div>`;
mermaid.initialize({ startOnLoad:true });
}
};
</script>
</body>
</html>
