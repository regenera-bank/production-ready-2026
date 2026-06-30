FROM hashicorp/terraform:1.9
WORKDIR /app
COPY . /app
USER 65532:65532
CMD ["sh", "-c", "echo repository=regenera-platform-terraform; sleep 3600"]
