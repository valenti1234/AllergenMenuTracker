#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Test di aggiornamento dell'inventario${NC}"
echo "=============================================="

# Controlla se esiste la versione JavaScript del test
if [ ! -f "test-inventory-update.js" ]; then
  echo -e "${YELLOW}File JavaScript non trovato, eseguo la compilazione...${NC}"
  
  # Verifica se typescript è installato
  if ! npm list -g typescript > /dev/null 2>&1; then
    echo -e "${YELLOW}Installazione di typescript globalmente...${NC}"
    npm install -g typescript
  fi
  
  # Compila il file TypeScript in JavaScript
  echo -e "${YELLOW}Compilazione del file TypeScript...${NC}"
  tsc test-inventory-update.ts
fi

# Esegui il test con Node.js
echo -e "\n${YELLOW}Esecuzione del test di aggiornamento dell'inventario...${NC}"
NODE_OPTIONS="--unhandled-rejections=strict" node test-inventory-update.js

echo -e "\n${GREEN}Test completato!${NC}" 