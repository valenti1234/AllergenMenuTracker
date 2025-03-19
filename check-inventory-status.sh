#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configurazione
SERVER="http://localhost:5050"
COOKIES_FILE="cookies.txt"

echo -e "${GREEN}Verifica implementazione aggiornamento inventario${NC}"
echo "=============================================="

# Autenticazione
echo -e "\n${YELLOW}1. Autenticazione...${NC}"
curl -s -X POST $SERVER/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"valenti1234", "password":"Itnelav3465#"}' \
  -c $COOKIES_FILE > /dev/null

echo -e "${GREEN}✓ Autenticazione completata${NC}"

# Verifica il codice in storage.ts - updateInventoryForPreparedOrder
echo -e "\n${YELLOW}2. Verifico l'implementazione di updateInventoryForPreparedOrder...${NC}"
CODE_PATH="server/storage.ts"

if [ ! -f "$CODE_PATH" ]; then
  echo -e "${RED}✗ File $CODE_PATH non trovato${NC}"
  exit 1
fi

echo -e "${YELLOW}Cercando updateInventoryForPreparedOrder nel file...${NC}"
FUNCTION_DEF=$(grep -n "async updateInventoryForPreparedOrder" "$CODE_PATH")
FUNCTION_LINE=$(echo "$FUNCTION_DEF" | cut -d':' -f1)

if [ -z "$FUNCTION_LINE" ]; then
  echo -e "${RED}✗ Funzione updateInventoryForPreparedOrder non trovata${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Funzione trovata alla riga $FUNCTION_LINE${NC}"

# Estrai la funzione
echo -e "${YELLOW}Estratto della funzione:${NC}"
head -n $((FUNCTION_LINE + 10)) "$CODE_PATH" | tail -n 10

# Verifica chiamata a updateInventoryForPreparedOrder in updateOrder
echo -e "\n${YELLOW}3. Verifico la chiamata a updateInventoryForPreparedOrder in updateOrder...${NC}"
UPDATE_ORDER_DEF=$(grep -n "async updateOrder" "$CODE_PATH")
UPDATE_ORDER_LINE=$(echo "$UPDATE_ORDER_DEF" | cut -d':' -f1)

if [ -z "$UPDATE_ORDER_LINE" ]; then
  echo -e "${RED}✗ Funzione updateOrder non trovata${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Funzione updateOrder trovata alla riga $UPDATE_ORDER_LINE${NC}"

# Verifica se updateInventoryForPreparedOrder viene chiamata
CALL_LINE=$(grep -n "updateInventoryForPreparedOrder" "$CODE_PATH" | grep -v "async update" | head -1)
CALL_LINE_NUM=$(echo "$CALL_LINE" | cut -d':' -f1)

if [ -z "$CALL_LINE_NUM" ]; then
  echo -e "${RED}✗ Nessuna chiamata a updateInventoryForPreparedOrder trovata${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Chiamata trovata alla riga $CALL_LINE_NUM${NC}"

# Estrai il contesto
echo -e "${YELLOW}Contesto della chiamata:${NC}"
head -n $((CALL_LINE_NUM + 3)) "$CODE_PATH" | tail -n 5

# Verifica la condizione di chiamata
CONDITION=$(head -n $CALL_LINE_NUM "$CODE_PATH" | tail -n 2)
echo -e "${YELLOW}Condizione per l'aggiornamento dell'inventario:${NC} ${CONDITION}"

# Verifica RecipeMapping
echo -e "\n${YELLOW}4. Verifico il codice della gestione delle ricette...${NC}"
RECIPE_MAPPINGS=$(grep -n "RecipeMapping" "$CODE_PATH" | head -5)
echo "$RECIPE_MAPPINGS"

# Verifica l'API degli ordini
echo -e "\n${YELLOW}5. Verifico l'API degli ordini...${NC}"
ROUTES_PATH="server/routes.ts"

if [ ! -f "$ROUTES_PATH" ]; then
  echo -e "${RED}✗ File $ROUTES_PATH non trovato${NC}"
  exit 1
fi

# Cerca gli endpoint per aggiornare un ordine
ORDER_UPDATE_ENDPOINT=$(grep -n "PATCH.*orders.*" "$ROUTES_PATH")
echo -e "${YELLOW}Endpoint per aggiornare un ordine:${NC}"
echo "$ORDER_UPDATE_ENDPOINT"

# Verifica l'accesso all'inventario
echo -e "\n${YELLOW}6. Verifica stato inventario attuale...${NC}"
INVENTORY=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# Conta gli elementi dell'inventario
INVENTORY_COUNT=$(echo "$INVENTORY" | grep -o '"id":"[^"]*"' | wc -l)
echo -e "${GREEN}✓ $INVENTORY_COUNT elementi trovati nell'inventario${NC}"

# Estrai i primi 3 elementi come esempio
echo -e "${YELLOW}Esempi di elementi nell'inventario:${NC}"
INVENTORY_SAMPLE=$(echo "$INVENTORY" | grep -o '{[^}]*}' | head -3)
echo "$INVENTORY_SAMPLE"

# Verifica le mappature ricetta
echo -e "\n${YELLOW}7. Verifica mappature ricetta esistenti...${NC}"
RECIPE_MAPPINGS=$(curl -s -b $COOKIES_FILE $SERVER/api/recipe-mappings \
  -H "Accept: application/json")

# Conta le mappature ricetta
MAPPINGS_COUNT=$(echo "$RECIPE_MAPPINGS" | grep -o '"menuItemId":"[^"]*"' | wc -l)
echo -e "${GREEN}✓ $MAPPINGS_COUNT mappature ricetta trovate${NC}"

# Verifica connessione MongoDB
echo -e "\n${YELLOW}8. Verifica la connessione al database...${NC}"
echo -e "${YELLOW}File .env:${NC}"
if [ -f ".env" ]; then
  grep -v PASSWORD .env || echo -e "${RED}✗ Nessuna variabile trovata${NC}"
  echo -e "${GREEN}✓ File .env esiste${NC}"
else
  echo -e "${RED}✗ File .env non trovato${NC}"
fi

echo -e "${YELLOW}\nFile server/db.ts:${NC}"
grep -n "mongoose.connect" "server/db.ts" || echo -e "${RED}✗ mongoose.connect non trovato${NC}"

echo -e "\n${GREEN}Verifica completata!${NC}"
echo -e "${YELLOW}Per testare l'aggiornamento dell'inventario in modo dettagliato, usa ./debug-inventory.sh${NC}" 