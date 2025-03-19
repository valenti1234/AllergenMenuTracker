#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Diagnostica e fix per l'aggiornamento inventario${NC}"
echo "=============================================="

# 1. Verifica la presenza del codice di aggiornamento inventario
CODE_PATH="server/storage.ts"

echo -e "\n${YELLOW}1. Verifico la funzione updateInventoryForPreparedOrder...${NC}"
INVENTORY_FUNC=$(grep -n "async updateInventoryForPreparedOrder" "$CODE_PATH")
INVENTORY_LINE=$(echo "$INVENTORY_FUNC" | cut -d':' -f1)

if [ -z "$INVENTORY_LINE" ]; then
  echo -e "${RED}✗ Funzione updateInventoryForPreparedOrder non trovata!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Funzione trovata alla riga $INVENTORY_LINE${NC}"
fi

# 2. Verifica la chiamata dalla funzione updateOrder
echo -e "\n${YELLOW}2. Verifico se updateInventoryForPreparedOrder viene chiamata...${NC}"
CALL_CODE=$(grep -n "await this.updateInventoryForPreparedOrder" "$CODE_PATH")
CALL_LINE=$(echo "$CALL_CODE" | cut -d':' -f1)

if [ -z "$CALL_LINE" ]; then
  echo -e "${RED}✗ Nessuna chiamata a updateInventoryForPreparedOrder trovata!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Chiamata trovata alla riga $CALL_LINE${NC}"
fi

# 3. Verifica la condizione di chiamata
echo -e "\n${YELLOW}3. Verifico la condizione della chiamata...${NC}"
CONDITION=$(grep -n "update.status === \"ready\" || update.status === \"served\" || update.status === \"completed\"" "$CODE_PATH")
CONDITION_LINE=$(echo "$CONDITION" | cut -d':' -f1)

if [ -z "$CONDITION_LINE" ]; then
  echo -e "${RED}✗ Condizione per l'aggiornamento non trovata!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Condizione trovata alla riga $CONDITION_LINE${NC}"
  echo -e "${YELLOW}$CONDITION${NC}"
fi

# 4. Verifica il controllo di stato precedente
echo -e "\n${YELLOW}4. Verifico il controllo per evitare aggiornamenti multipli...${NC}"
CHECK_CODE=$(grep -n "Aggiorniamo l'inventario solo se lo stato precedente" "$CODE_PATH")
CHECK_LINE=$(echo "$CHECK_CODE" | cut -d':' -f1)

if [ -z "$CHECK_LINE" ]; then
  echo -e "${RED}✗ Controllo stato precedente non trovato!${NC}"
else
  echo -e "${GREEN}✓ Controllo trovato alla riga $CHECK_LINE${NC}"
  
  # Estrai la logica di controllo
  CHECK_LOGIC=$(head -n $((CHECK_LINE + 5)) "$CODE_PATH" | tail -n 6)
  echo -e "${YELLOW}Logica di controllo:${NC}"
  echo "$CHECK_LOGIC"
fi

# 5. Verifica l'implementazione della funzione
echo -e "\n${YELLOW}5. Verifico l'implementazione di updateInventoryForPreparedOrder...${NC}"
IMPLEMENTATION=$(head -n $((INVENTORY_LINE + 20)) "$CODE_PATH" | tail -n 20)
echo -e "${YELLOW}Primi 20 righe della funzione:${NC}"
echo "$IMPLEMENTATION"

# Cerca potenziali problemi nell'implementazione
echo -e "\n${YELLOW}6. Analisi di potenziali problemi...${NC}"

# Controlla se ci sono errori console.log
CONSOLE_LOGS=$(grep -n "console.log" "$CODE_PATH" | grep -A 10 -B 10 "updateInventoryForPreparedOrder" | wc -l)
echo -e "- Numero di console.log nell'area: $CONSOLE_LOGS"

# Controlla se ci sono try-catch
TRY_CATCH=$(grep -n "try" "$CODE_PATH" | grep -A 3 -B 3 "updateInventoryForPreparedOrder" | wc -l)
echo -e "- Blocchi try-catch nell'area: $TRY_CATCH"

# 7. Test pratico
echo -e "\n${YELLOW}7. Eseguiamo un test pratico...${NC}"
echo -e "${YELLOW}Modifica consigliata: stampiamo più informazioni di debug${NC}"

# Crea un file di backup
BACKUP_FILE="server/storage.ts.bak"
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}Creazione di un backup di storage.ts...${NC}"
  cp "$CODE_PATH" "$BACKUP_FILE"
  echo -e "${GREEN}✓ Backup creato: $BACKUP_FILE${NC}"
fi

# Aggiungi un output di debug più dettagliato
echo -e "\n${YELLOW}Aggiungo log di debug alla funzione updateInventoryForPreparedOrder...${NC}"

# Usa sed per aggiungere log dettagliati
sed -i "$((INVENTORY_LINE + 2))i\      console.log('DEBUG INVENTARIO: Inizio aggiornamento per ordine', orderId);" "$CODE_PATH"
sed -i "s/console.log(\`Aggiornamento inventario per ordine servito: \${orderId}\`);/console.log(\`DEBUG INVENTARIO: Aggiornamento inventario per ordine servito: \${orderId}\`);/" "$CODE_PATH"

# Aggiungi log dettagliati alla chiamata
sed -i "$((CALL_LINE - 1))i\          console.log('DEBUG INVENTARIO: Chiamata a updateInventoryForPreparedOrder per ordine', id);" "$CODE_PATH"

echo -e "${GREEN}✓ Log di debug aggiunti${NC}"

# 8. Suggerimenti
echo -e "\n${YELLOW}8. Suggerimenti per risolvere il problema:${NC}"
echo -e "1. Verifica che i log di debug appaiano nella console del server quando cambi lo stato di un ordine"
echo -e "2. Controlla che la funzione updateInventoryForPreparedOrder venga effettivamente chiamata"
echo -e "3. Assicurati che RecipeMappingModel.findOne() trovi effettivamente le mappature delle ricette"
echo -e "4. Verifica che la gestione delle eccezioni non silenzi errori importanti"
echo -e "5. Controlla l'output del server durante l'esecuzione di ./debug-inventory.sh"
echo -e "6. Se la funzione viene chiamata ma non aggiorna l'inventario, controlla il processo di ricerca/creazione elementi"
echo -e "7. Prova a riavviare il server Node.js per assicurarti che le modifiche siano in effetto"

echo -e "\n${GREEN}Diagnostica completata!${NC}"
echo -e "${YELLOW}Per testare se i cambiamenti hanno effetto, esegui ./debug-inventory.sh${NC}" 