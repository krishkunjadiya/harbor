# Use official Python lightweight image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for data science libraries
# (scikit-learn and others often need these to build/run)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install dependencies (no-cache-dir to keep image small)
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Hugging Face embedding model during the image build process
# so that the container boots up instantly without waiting for a download!
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the rest of the application code
COPY . .

# Expose the FastAPI port (Render defines PORT dynamically, but local testing uses 8000)
EXPOSE 8000

# Start the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
