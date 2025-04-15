# Dockerfile

# 1. Choose a base Python image
FROM python:3.11-slim

# 3. Set the working directory.
WORKDIR /app

# 4. Install system dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y python3-dev default-libmysqlclient-dev build-essential pkg-config
# 5. install Python dependencies
# Copy requirements.txt and install dependencies first to leverage Docker’s layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the project code into the working directory.
COPY . .

RUN chmod +x entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# 7. Expose port 8000 (default for Django dev server)
EXPOSE 8000

# 8. Run the development server.
# Note: Django’s runserver is intended for development only and should not be used in production.
CMD ["gunicorn", "webDjangoProject3.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
