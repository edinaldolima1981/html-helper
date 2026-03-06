

# Plano: Deploy na Hostinger VPS

## Problemas a corrigir primeiro

### 1. Erro de build — Edge Function `whatsapp-ai`
O build está falhando porque a edge function referencia `openai` sem estar no `deno.json`. Precisa corrigir isso.

### 2. Arquivo YAML duplicado e quebrado
Existe `.github/.github/workflows/deploy.yml` (caminho duplicado e com texto em português misturado). Precisa ser removido.

### 3. YAML com indentação errada
O arquivo `.github/workflows/deploy.yml` tem indentação incorreta (usa 1 espaço em vez de 2). O GitHub Actions vai rejeitar isso.

---

## Passos do plano

### Passo 1 — Corrigir o `deploy.yml` com indentação correta
Reescrever `.github/workflows/deploy.yml` com indentação YAML válida (2 espaços).

### Passo 2 — Remover arquivo duplicado
Deletar `.github/.github/workflows/deploy.yml` (caminho errado com texto em português).

### Passo 3 — Corrigir erro de build da edge function
Adicionar import map ou corrigir a referência ao `openai` na edge function `whatsapp-ai` para eliminar o erro de build.

### Passo 4 — Garantir que `docker-compose.yaml` passa variáveis corretamente
O `docker-compose.yaml` atual passa as variáveis como `args` do build, mas o Dockerfile não as recebe com `ARG`. Precisa adicionar as instruções `ARG` e `ENV` no Dockerfile para que o Vite tenha acesso às variáveis durante o build.

---

## Resultado
Após essas correções, cada push para `main` no GitHub vai:
1. Acionar o GitHub Actions
2. Fazer deploy automático na VPS Hostinger
3. O Docker vai buildar o React app e servir via Nginx na porta 80

