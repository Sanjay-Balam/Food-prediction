FROM python:3.12-slim

WORKDIR /app

# Install libgomp1 (required for LightGBM OpenMP support on Linux)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data and artifacts directories exist
RUN mkdir -p /app/data /app/artifacts /app/forecasts

EXPOSE 8000

CMD ["uvicorn", "forecast.api:app", "--host", "0.0.0.0", "--port", "8000"]
