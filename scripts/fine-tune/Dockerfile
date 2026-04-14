FROM pytorch/pytorch:2.4.0-cuda12.1-cudnn9-devel

WORKDIR /workspace

# Install system utilities
RUN apt-get update && apt-get install -y git wget && rm -rf /var/lib/apt/lists/*

# Copy the requirements file
COPY requirements.txt /workspace/

# Install the Python dependencies
# We use pip to install the requirements which includes Unsloth, transformers, trl, etc.
RUN pip install --no-cache-dir -r requirements.txt

# The script will be mounted in /workspace via docker-compose
CMD ["python", "train.py"]
