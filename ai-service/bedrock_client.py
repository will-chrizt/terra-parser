import json
import boto3
import os


# Choose a Bedrock model you have access to, e.g., Claude 3.5 Sonnet (as of 2025)
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")


bedrock = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))




def summarize_infra(structured_summary: dict) -> str:
# Compose a concise prompt
system_prompt = (
"You are an expert DevOps assistant. Given a structured summary of Terraform "
"infrastructure (providers, resources, modules, variables, outputs), write a concise, "
"clear explanation of what the stack provisions, highlight security and cost risks, and "
"list key resources with purpose. Keep it under 250 words."
)


user_content = json.dumps(structured_summary, indent=2)


# Anthropic messages API format over Bedrock
body = {
"anthropic_version": "bedrock-2023-05-31",
"max_tokens": 600,
"system": system_prompt,
"messages": [
{"role": "user", "content": [{"type": "text", "text": user_content}]}
],
"temperature": 0.2,
}


response = bedrock.invoke_model(
modelId=MODEL_ID,
body=json.dumps(body),
contentType="application/json",
accept="application/json",
)
payload = json.loads(response["body"].read())


# Extract text depending on the model output format
if "content" in payload and payload["content"]:
parts = payload["content"]
texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
return "\n".join([t for t in texts if t])


# Fallback for other providers/models if needed
return json.dumps(payload)
