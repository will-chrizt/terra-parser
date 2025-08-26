<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Terraform Infra Summarizer</title>
<style>
body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI,
Roboto, Helvetica, Arial; margin: 2rem; }
textarea { width: 100%; height: 200px; }
.row { display: flex; gap: 1rem; flex-wrap: wrap; }
.card { border: 1px solid #ddd; border-radius: 12px; padding: 1rem; flex:
1; min-width: 320px; }
button { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid
#333; background: #111; color: #fff; cursor: pointer; }
pre { background: #f6f8fa; padding: 1rem; border-radius: 8px; overflow:
auto; }
</style>
</head>
<body>
<h1>Terraform Infra Summarizer</h1>
<div class="row">
<div class="card">
<h3>1) Paste Terraform (.tf) content</h3>
<textarea id="tf"></textarea>
<div style="margin-top: 0.5rem; display:flex; gap:0.5rem;">
<button id="parseBtn">Parse</button>
<button id="demoBtn">Load Demo</button>
</div>
<p style="font-size: 12px; color:#555">Services assumed at: parser:8001, 
ai:8002, report:8003</p>
</div>
<div class="card">
<h3>2) Parsed Summary</h3>
<pre id="parsed"></pre>
<button id="summarizeBtn">Summarize (Bedrock)</button>
</div>
<div class="card">
<h3>3) Report</h3>
<div id="reportHtml"></div>
<button id="makeReportBtn">Generate Report</button>
</div>
</div>
<script>
const parserURL = location.hostname + ':8001';
const aiURL = location.hostname + ':8002';
const reportURL = location.hostname + ':8003';
let structured = null;
let summaryText = '';
document.getElementById('demoBtn').onclick = () => {
document.getElementById('tf').value = `
provider "aws" {
 region = "us-east-1"
}
resource "aws_vpc" "main" {
 cidr_block = "10.0.0.0/16"
}
resource "aws_subnet" "public_a" {
 vpc_id = aws_vpc.main.id
 cidr_block = "10.0.1.0/24"
 map_public_ip_on_launch = true
}resource "aws_security_group" "web" {
 name = "web-sg"
 description = "Allow HTTP and SSH"
 vpc_id = aws_vpc.main.id
 ingress = [
 {
 from_port = 22
 to_port = 22
 protocol = "tcp"
 cidr_blocks = ["0.0.0.0/0"]
 },
 {
 from_port = 80
 to_port = 80
 protocol = "tcp"
 cidr_blocks = ["0.0.0.0/0"]
 }
 ]
}
output "vpc_id" {
 value = aws_vpc.main.id
}
`;
};
document.getElementById('parseBtn').onclick = async () => {
const tf = document.getElementById('tf').value;
const res = await fetch(`http://${parserURL}/parse-text`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(tf)
});
const data = await res.json();
if (!data.ok) { alert('Parse failed: ' + (data.detail || 'unknown'));
return; }
structured = data.summary;
document.getElementById('parsed').textContent =
JSON.stringify(structured, null, 2);
};
document.getElementById('summarizeBtn').onclick = async () => {
if (!structured) { alert('Parse first.'); return; }
const res = await fetch(`http://${aiURL}/summarize`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ summary: structured })
});
  const data = await res.json();
if (!data.ok) { alert('Summarize failed: ' + (data.detail ||
'unknown')); return; }
summaryText = data.summary_text;
alert('Summary ready! Now generate a report.');
};
document.getElementById('makeReportBtn').onclick = async () => {
if (!summaryText) { alert('Summarize first.'); return; }
const res = await fetch(`http://${reportURL}/report`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ summaryText, structured })
});
const data = await res.json();
if (!data.ok) { alert('Report failed'); return; }
document.getElementById('reportHtml').innerHTML = data.html;
};
</script>
</body>
</html>
