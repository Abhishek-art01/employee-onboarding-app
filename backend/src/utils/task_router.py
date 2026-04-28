import os
import asyncio
from typing import Dict, Any
from dotenv import load_dotenv
from litellm import acompletion

# Load environment variables
load_dotenv()

# -----------------------------
# 1. Lightweight Classifier
# -----------------------------
async def classify_task(prompt: str) -> str:
    """
    Uses a fast model to classify the prompt into one of:
    ["extraction", "reasoning", "coding", "formatting"]
    """
    try:
        response = await acompletion(
            model="groq/llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a classifier. "
                        "Read the user prompt and output ONLY one word: "
                        "extraction, reasoning, coding, or formatting."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        classification = response["choices"][0]["message"]["content"].strip().lower()
        if classification not in {"extraction", "reasoning", "coding", "formatting"}:
            classification = "reasoning"  # default fallback
        return classification
    except Exception as e:
        # Default to reasoning if classification fails
        return "reasoning"


# -----------------------------
# 2. Execution Router
# -----------------------------
async def execute_prompt(prompt: str, task_type: str) -> Dict[str, Any]:
    """
    Routes the prompt to the best-suited model based on task_type.
    Includes LiteLLM fallback handling.
    """
    try:
        if task_type == "extraction":
            model = "gemini/gemini-1.5-flash"
            fallbacks = ["huggingface/meta-llama/Llama-2-7b-chat-hf"]

        elif task_type == "reasoning":
            model = "openrouter/deepseek/deepseek-r1"
            fallbacks = ["togethercomputer/llama-2-70b-chat"]

        elif task_type == "coding":
            model = "groq/llama-3.3-70b-versatile"
            fallbacks = ["huggingface/meta-llama/Llama-2-13b-chat-hf"]

        elif task_type == "formatting":
            model = "groq/llama-3.1-8b-instant"
            fallbacks = ["huggingface/meta-llama/Llama-2-7b-chat-hf"]

        else:
            raise ValueError(f"Unsupported task_type: {task_type}")

        response = await acompletion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            fallbacks=fallbacks,
        )

        return {
            "model": model,
            "task_type": task_type,
            "output": response["choices"][0]["message"]["content"],
        }

    except Exception as e:
        return {
            "error": str(e),
            "model": None,
            "task_type": task_type,
            "output": None,
        }


# -----------------------------
# 3. Example Usage
# -----------------------------
if __name__ == "__main__":
    async def main():
        user_prompt = "Write a Python function to calculate covariance between two lists."
        task_type = await classify_task(user_prompt)
        print(f"Classified as: {task_type}")

        result = await execute_prompt(user_prompt, task_type)
        print(result)

    asyncio.run(main())
