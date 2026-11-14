"""Chef prep message. The LLM only rewords the finished forecast; it never creates or changes a quantity.
A reply containing any number that is not in the forecast is discarded and the plain table is used."""
import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import pandas as pd

SYSTEM_PROMPT = ("You are a kitchen assistant in a Hyderabad restaurant. Rewrite the forecast you are given as a "
                 "short, friendly prep message for the chef. Use ONLY the numbers given, exactly as given. Do not "
                 "add totals, percentages, times, prices or any other number.")


def read_env_file(path: Path) -> dict[str, str]:
    values = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            key, has_equals, value = line.strip().partition("=")
            if has_equals and key and not key.startswith("#"):
                values[key.strip()] = value.strip().strip("'\"")
    return values


@dataclass(frozen=True)
class LLMConfig:
    """Groq, xAI and OpenAI all speak the OpenAI chat API, so switching provider is only a config change."""
    api_key: str = field(repr=False)  # never printed in logs or tracebacks
    model: str
    base_url: str | None = None
    reasoning_effort: str | None = None

    @classmethod
    def from_environment(cls, env_file: Path) -> "LLMConfig | None":
        """Real environment variables override the .env file. None when no key/model is configured."""
        values = read_env_file(env_file) | {k: v for k, v in os.environ.items() if k.startswith("LLM_")}
        if not (values.get("LLM_API_KEY") and values.get("LLM_MODEL")):
            return None
        return cls(api_key=values["LLM_API_KEY"], model=values["LLM_MODEL"],
                   base_url=values.get("LLM_BASE_URL") or None,
                   reasoning_effort=values.get("LLM_REASONING_EFFORT") or None)


class ChatClient(Protocol):
    def complete(self, system_prompt: str, user_prompt: str) -> str: ...


class OpenAICompatibleClient:
    def __init__(self, config: LLMConfig):
        from openai import OpenAI
        self._client = OpenAI(api_key=config.api_key, base_url=config.base_url)
        self._config = config

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        effort = {"reasoning_effort": self._config.reasoning_effort} if self._config.reasoning_effort else {}
        reply = self._client.chat.completions.create(
            model=self._config.model, temperature=0.2,
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            **effort)
        return reply.choices[0].message.content or ""


def format_as_table(forecast: pd.DataFrame) -> str:
    lines = []
    for date, rows in forecast.groupby("date", sort=True):
        lines.append(pd.Timestamp(date).strftime("%a %d %b %Y"))
        lines += [f"  {row.item}: {row.likely}  (range {row.low}-{row.high})" for row in rows.itertuples()]
    return "\n".join(lines)


def uses_only_forecast_numbers(text: str, forecast: pd.DataFrame) -> bool:
    allowed = set(forecast[["low", "likely", "high"]].to_numpy().ravel().tolist())
    for date in pd.to_datetime(forecast["date"].unique()):
        allowed |= {date.day, date.month, date.year, date.year % 100}
    return all(int(number) in allowed for number in re.findall(r"\d+", text))


class PrepMessageWriter:
    def __init__(self, chat_client: ChatClient | None):
        self.chat_client = chat_client

    def write(self, forecast: pd.DataFrame, language: str = "English") -> tuple[str, str]:
        """Returns (message, source). source is 'llm', or why the plain table was used instead."""
        table = format_as_table(forecast)
        if self.chat_client is None:
            return table, "table (no LLM configured in .env)"
        try:
            text = self.chat_client.complete(SYSTEM_PROMPT, self._user_prompt(forecast, language))
        except Exception as error:  # network/auth/model errors must never block the prep sheet
            return table, f"table (LLM call failed: {type(error).__name__})"
        if not text.strip() or not uses_only_forecast_numbers(text, forecast):
            return table, "table (LLM reply changed or added numbers)"
        return text, "llm"

    @staticmethod
    def _user_prompt(forecast: pd.DataFrame, language: str) -> str:
        rows = forecast[["date", "item", "low", "likely", "high"]].to_dict("records")
        return (f"Language: {language}.\nForecast (likely = portions to prepare, low-high = safe range):\n"
                f"{json.dumps(rows, default=str)}")
