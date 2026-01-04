# OpenBox Guardrails Evaluation

OpenBox Guardrails is a robust API service designed to evaluate and enforce safety and content moderation for AI agents. It provides a set of guardrails to ensure AI-generated content adheres to safety guidelines and content policies.

## Features

- **Content Moderation**: Detect and filter inappropriate content
- **PII Detection**: Identify and handle personally identifiable information
- **Toxic Language Detection**: Flag and manage toxic or harmful language
- **NSFW Content Detection**: Identify not-safe-for-work content
- **Custom Rule Support**: Implement custom validation rules
- **RESTful API**: Easy integration with existing systems

## Getting Started

### Prerequisites

- Python 3.12+
- pip (Python package manager)
- PostgreSQL (for production)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/guardrails-openbox.git
   cd guardrails-openbox
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Deployment

### Docker

Build and run using Docker:

```bash
docker build --build-arg GUARDRAILS_TOKEN=$GUARDRAILS_TOKEN -t guardrails-openbox .
docker run -p 8000:8000 guardrails-openbox
```

### Docker + Postgres (openbox network)

1. Create the network (if not exist):
   ```bash
   docker network create openbox
   ```

2. Deploy Postgres with a named volume:
   ```bash
   docker volume create openbox-postgres-data
   docker run --name openbox-postgres --network openbox -p 5432:5432 \
     -e POSTGRES_DB=openbox \
     -e POSTGRES_USER=openbox \
     -e POSTGRES_PASSWORD=openbox \
     -v openbox-postgres-data:/var/lib/postgresql/data \
     postgres:16-alpine
   ```

3. Build the API image:

   Update the .env with postgres credentials

   ```bash
   docker build --build-arg GUARDRAILS_TOKEN=$GUARDRAILS_TOKEN -t guardrails-openbox .
   ```

4. Run the API container:
   ```bash
   docker run --name openbox-guardrails --network openbox -p 8000:8000 \
     -e DB_HOST=openbox-postgres \
     -e DB_PORT=5432 \
     -e DB_USER=openbox \
     -e DB_PASSWORD=openbox \
     -e DB_NAME=openbox \
     guardrails-openbox
   ```
