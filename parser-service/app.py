from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import hcl2
from typing import Dict, Any

app = FastAPI(title="Terraform Parser Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_hcl_text(text: str) -> Dict[str, Any]:
    """Parse Terraform HCL text into a Python dictionary."""
    import io
    return hcl2.load(io.StringIO(text))


def summarize_parsed(data: Dict[str, Any]) -> Dict[str, Any]:
    """Return a structured summary of Terraform resources for visualization."""
    providers = []
    if "provider" in data:
        for p in data["provider"]:
            for name, cfg in p.items():
                region = cfg.get("region") if isinstance(cfg, dict) else None
                providers.append({"name": name, "region": region})

    variables = []
    for var in data.get("variable", []):
        for name, cfg in var.items():
            variables.append({
                "name": name,
                "type": cfg.get("type"),
                "default": cfg.get("default"),
                "description": cfg.get("description"),
            })

    resources = []
    for res in data.get("resource", []):
        for rtype, entries in res.items():
            for name, cfg in entries.items():
                item = {"type": rtype, "name": name}
                if isinstance(cfg, dict):
                    for k in ["cidr_block", "vpc_id", "subnet_id", "engine",
                              "instance_class", "allocated_storage", "port",
                              "ingress", "egress", "ami", "instance_type"]:
                        if k in cfg:
                            item[k] = cfg[k]
                resources.append(item)

    modules = []
    for mod in data.get("module", []):
        for name, cfg in mod.items():
            source = cfg.get("source") if isinstance(cfg, dict) else None
            modules.append({"name": name, "source": source})

    outputs = []
    for out in data.get("output", []):
        for name, cfg in out.items():
            outputs.append({"name": name})

    return {
        "providers": providers,
        "variables": variables,
        "resources": resources,
        "modules": modules,
        "outputs": outputs,
    }


@app.post("/parse-file")
async def parse_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Parse a Terraform file and return raw + summarized JSON."""
    try:
        content = (await file.read()).decode()
        data = parse_hcl_text(content)
        return {"ok": True, "summary": summarize_parsed(data), "raw": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")


@app.post("/parse-text")
async def parse_text(tf_text: str) -> Dict[str, Any]:
    """Parse Terraform text input (from frontend textarea)."""
    try:
        data = parse_hcl_text(tf_text)
        return {"ok": True, "summary": summarize_parsed(data), "raw": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")


@app.get("/")
async def root():
    return {"service": "parser", "status": "ok"}
