FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

EXPOSE 8000

ENV PYTHONPATH=/app

# Run gunicorn inside the backend directory because config.json is expected to be in the current directory
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:8000 app:app"]
