#!/usr/bin/env bash
# Resolve o monorepo Regenera Bank a partir do git root.
# Não fixa path em volume externo — evita acoplamento a máquinas/sessões.

_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
_git_root="$(cd "$_script_dir/../.." && pwd)"
if command -v git >/dev/null 2>&1 && git -C "$_git_root" rev-parse --show-toplevel >/dev/null 2>&1; then
  REGENERA_CANONICAL_REPO="$(git -C "$_git_root" rev-parse --show-toplevel)"
else
  REGENERA_CANONICAL_REPO="$_git_root"
fi

if [[ -n "${REGENERA_ALLOW_ALT_REPO:-}" && -n "${REGENERA_REPO:-}" ]]; then
  :
else
  REGENERA_REPO="$REGENERA_CANONICAL_REPO"
fi

export REGENERA_CANONICAL_REPO REGENERA_REPO
