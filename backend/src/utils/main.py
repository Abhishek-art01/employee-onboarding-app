import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from task_router import classify_task, execute_prompt

app = FastAPI(title="Task-Based LLM Router")

class PromptRequest(BaseModel):
    prompt: str
    task_type: str | None = None  # optional, can be auto-classified


@app.post("/execute")
async def execute(request: PromptRequest):
    try:
        # If user didn’t provide task_type, classify automatically
        task_type = request.task_type or await classify_task(request.prompt)

        result = await execute_prompt(request.prompt, task_type)

        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "task_type": task_type,
            "model": result["model"],
            "output": result["output"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
