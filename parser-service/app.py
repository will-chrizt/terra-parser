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
    """Parse HCL text into Python dictionary."""
    import io
    data = hcl2.load(io.StringIO(text))
    return data


def summarize_parsed(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a lightweight, structured summary suitable for visualization."""
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
