.PHONY: dev demo test build down logs clean install-backend install-frontend

# ── Environment ──────────────────────────────────────────────────────────────
ENV_FILE ?= .env

# ── Development ───────────────────────────────────────────────────────────────
dev:
	@echo "🚀 Starting Agent Control Tower (dev)..."
	docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml \
		--env-file $(ENV_FILE) up --build

down:
	docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml down

logs:
	docker compose -f infra/docker-compose.yml logs -f

# ── Demo ──────────────────────────────────────────────────────────────────────
demo:
	@echo "🤖 Running demo agents..."
	cd demo-agents && python run_demo.py

# ── Tests ─────────────────────────────────────────────────────────────────────
test: test-adapters test-anomaly test-backend

test-adapters:
	@echo "🧪 Testing adapters..."
	cd adapters && python -m pytest tests/ -v --tb=short

test-anomaly:
	@echo "🧪 Testing anomaly detectors..."
	cd anomaly && python -m pytest tests/ -v --tb=short

test-backend:
	@echo "🧪 Testing backend..."
	cd backend && python -m pytest tests/ -v --tb=short

# ── Install ───────────────────────────────────────────────────────────────────
install-backend:
	cd backend && pip install -r requirements.txt

install-adapters:
	pip install -r adapters/requirements.txt

install-frontend:
	cd frontend && npm install

install: install-backend install-adapters install-frontend

# ── Ollama ────────────────────────────────────────────────────────────────────
pull-models:
	bash infra/ollama/pull-models.sh

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -type f -name "*.pyc" -delete 2>/dev/null; true
	rm -rf frontend/.next frontend/node_modules
