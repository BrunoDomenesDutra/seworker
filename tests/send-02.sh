#!/usr/bin/env bash
set -e

# Caminho do .env (ajuste se necessário)
ENV_FILE="../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] .env not found at $ENV_FILE"
  exit 1
fi

# Carrega variáveis do .env
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Valida variáveis obrigatórias
if [ -z "$STREAMELEMENTS_JWT" ]; then
  echo "[ERROR] STREAMELEMENTS_JWT is not set"
  exit 1
fi

if [ -z "$STREAMELEMENTS_CHANNEL_ID" ]; then
  echo "[ERROR] STREAMELEMENTS_CHANNEL_ID is not set"
  exit 1
fi

echo "[INFO] Sending test tip to StreamElements..."
echo "[INFO] Channel: $STREAMELEMENTS_CHANNEL_ID"

curl --request POST \
  --url "https://api.streamelements.com/kappa/v2/tips/$STREAMELEMENTS_CHANNEL_ID" \
  --header "Authorization: Bearer $STREAMELEMENTS_JWT" \
  --header "Content-Type: application/json" \
  --data '{
    "user": {
      "userId": "local-test",
      "username": "RANMZA",
      "email": "local@test.com"
    },
    "provider": "manualTest",
    "message": "Teste local #zelda",
    "amount": 50,
    "currency": "USD",
    "imported": true
  }'

echo
echo "[INFO] Done."
