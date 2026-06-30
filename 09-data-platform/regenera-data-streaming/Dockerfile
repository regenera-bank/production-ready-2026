FROM python:3.12-alpine
WORKDIR /app
COPY . /app
USER 65532:65532
CMD ["sh", "-c", "echo repository=regenera-data-streaming; sleep 3600"]
