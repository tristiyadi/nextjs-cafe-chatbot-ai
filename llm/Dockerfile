# Use the official Ollama image as the base
FROM ollama/ollama:latest

# Copy the custom Modelfiles into the container
COPY Modelfile /tmp/Modelfile
COPY Modelfile.qwen /tmp/Modelfile.qwen

# We need to start the Ollama server temporarily during build 
# to pull the base models and create the custom model.
# Note: models will be stored in /root/.ollama
RUN nohup sh -c "ollama serve &" && \
    sleep 5 && \
    echo "Pulling llama3.2:1b..." && \
    ollama pull llama3.2:1b && \
    echo "Creating custom model: kafi..." && \
    ollama create kafi -f /tmp/Modelfile && \
    echo "Pulling mistral..." && \
    ollama pull mistral && \
    echo "Pulling qwen2.5:1.5b..." && \
    ollama pull qwen2.5:1.5b && \
    echo "Creating custom model: kafi-qwen..." && \
    ollama create kafi-qwen -f /tmp/Modelfile.qwen && \
    echo "All models ready!"

# No need for an entrypoint change, the base image already has it.
