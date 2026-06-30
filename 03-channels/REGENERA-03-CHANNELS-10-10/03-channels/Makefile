SHELL := /usr/bin/env bash
PYTHON ?= python3
export PYTHONDONTWRITEBYTECODE := 1

.PHONY: clean validate test security build verify-release all

clean:
	@$(PYTHON) scripts/channels.py clean --out dist

validate:
	@$(PYTHON) scripts/channels.py validate

# Compilação ocorre uma vez.
# build não recompila teste aprovado.
test:
	@$(PYTHON) scripts/channels.py test --out dist
	@$(PYTHON) -B -m unittest discover -s tests -p 'test_*.py' -v

security:
	@$(PYTHON) scripts/channels.py security

build:
	@$(PYTHON) scripts/channels.py build --out dist

verify-release:
	@$(PYTHON) scripts/channels.py verify-release --out dist

all: clean validate test security build verify-release
