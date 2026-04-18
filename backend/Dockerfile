# Stage 1: Base - Setup common environment
FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Stage 2: Dependencies - Install production dependencies
FROM base AS dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Test - Run linting and tests
FROM dependencies AS test
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
# Set environment variables for tests
ENV SECRET_KEY=test_secret_key
# Run ruff for linting
RUN ruff check .
# Run pytest for testing
RUN pytest tests/ && touch /app/.test-success

# Stage 4: Final - Build the production image
FROM base AS final
# Ensure tests passed by copying from the test stage
COPY --from=test /app/.test-success /app/.test-success
# Copy only necessary files (ignoring what's in .dockerignore)
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin
COPY . .

# Remove the test success marker, tests, and dev dependencies from the final image
RUN rm /app/.test-success && \
    rm -rf tests/ requirements-dev.txt pytest.ini

RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
