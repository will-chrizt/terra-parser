<!DOCTYPE html>
<html>
<head>
  <title>Terraform Visualizer</title>
  <script type="module" src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    #diagram { border: 1px solid #ccc; padding: 10px; margin-top: 10px; }
    textarea { width: 100%; height: 150px; }
  </style>
</head>
<body>
  <h2>Terraform Visualizer</h2>

  <textarea id="tfText" placeholder="Paste Terraform HCL here"></textarea><br/>
  <button id="parseBtn">Parse</button>
  <button id="visualizeLocalBtn">Visualize Locally</button>
  <button id="visualizeLLMBtn">Visualize via LLM (Bedrock)</button>

  <div id="diagram"></div>

  <script>
    mermaid.initialize({ startOnLoad: true });

    let parsedData = null;

    document.getElementById('parseBtn').onclick = async () => {
      const tfText = document.getElementById('tfText').value;
      const resp = await fetch('http://localhost:8001/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tf_text: tfText })
      });
      const data = await resp.json();
      if (data.ok) {
        parsedData = data.summary;
        alert('Parsing successful! Now visualize.');
      } else {
        alert('Parsing failed: ' + data.detail);
      }
    };

    function generateMermaidLocal(parsed) {
      let diagram = 'graph TD\n';
      // VPCs
      parsed.resources.filter(r => r.type.includes('vpc')).forEach(vpc => {
        diagram += `  ${vpc.type}_${vpc.name}["${vpc.type}: ${vpc.name}"]\n`;
      });
      // Subnets
      parsed.resources.filter(r => r.type.includes('subnet')).forEach(subnet => {
        if(subnet.vpc_id)
          diagram += `  ${subnet.vpc_id} --> ${subnet.type}_${subnet.name}\n`;
        diagram += `  ${subnet.type}_${subnet.name}["${subnet.type}: ${subnet.name}"]\n`;
      });
      // Other resources
      parsed.resources.forEach(res => {
        if(!res.type.includes('vpc') && !res.type.includes('subnet')) {
          const parent = res.subnet_id || res.vpc_id;
          if(parent) diagram += `  ${parent} --> ${res.type}_${res.name}\n`;
          diagram += `  ${res.type}_${res.name}["${res.type}: ${res.name}"]\n`;
        }
      });
      return diagram;
    }

    document.getElementById('visualizeLocalBtn').onclick = () => {
      if(!parsedData) return alert('Parse Terraform first!');
      const code = generateMermaidLocal(parsedData);
      document.getElementById('diagram').innerHTML = `<div class="mermaid">${code}</div>`;
      mermaid.contentLoaded();
    };

    document.getElementById('visualizeLLMBtn').onclick = async () => {
      if(!parsedData) return alert('Parse Terraform first!');
      const resp = await fetch('http://localhost:8002/visualize-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsed: parsedData })
      });
      const data = await resp.json();
      if(data.ok) {
        document.getElementById('diagram').innerHTML = `<div class="mermaid">${data.mermaid}</div>`;
        mermaid.contentLoaded();
      } else {
        alert('LLM Visualization failed: ' + data.error);
      }
    };
  </script>
</body>
</html>
