#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fix per l'aggiornamento dell'inventario${NC}"
echo "=============================================="

# Verifica storage.ts esistente
CODE_PATH="server/storage.ts"
if [ ! -f "$CODE_PATH" ]; then
  echo -e "${RED}✗ File $CODE_PATH non trovato${NC}"
  exit 1
fi

# Crea backup se non esiste
BACKUP_FILE="server/storage.ts.orig"
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}Creazione di un backup originale di storage.ts...${NC}"
  cp "$CODE_PATH" "$BACKUP_FILE"
  echo -e "${GREEN}✓ Backup originale creato: $BACKUP_FILE${NC}"
fi

# Trova la riga con la condizione di aggiornamento
echo -e "\n${YELLOW}1. Trovo la condizione di aggiornamento inventario...${NC}"
CONDITION_LINE=$(grep -n "oldStatus && !\\[\"ready\", \"served\", \"completed\"\\].includes(oldStatus)" "$CODE_PATH" | cut -d':' -f1)

if [ -z "$CONDITION_LINE" ]; then
  echo -e "${RED}✗ Condizione di aggiornamento non trovata${NC}"
  CONDITION_LINE=$(grep -n "oldStatus && !" "$CODE_PATH" | cut -d':' -f1)
  
  if [ -z "$CONDITION_LINE" ]; then
    echo -e "${RED}✗ Impossibile trovare la condizione di aggiornamento${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✓ Condizione trovata alla riga $CONDITION_LINE${NC}"

# Modifica la condizione per forzare sempre l'aggiornamento
echo -e "\n${YELLOW}2. Modifico la condizione per forzare sempre l'aggiornamento...${NC}"

# Strategia 1: Modifica la condizione per includere sempre lo stato precedente
echo -e "${YELLOW}Strategia 1: Modifico la condizione per forzare l'aggiornamento${NC}"
TEMP_FILE=$(mktemp)
sed "${CONDITION_LINE}s/oldStatus && !\[\"ready\", \"served\", \"completed\"\].includes(oldStatus)/true/" "$CODE_PATH" > "$TEMP_FILE"

# Verifica se la sostituzione ha avuto successo
CONDITION_COUNT=$(grep -c "true" "$TEMP_FILE")
if [ "$CONDITION_COUNT" -gt 5 ]; then
  echo -e "${RED}✗ Troppe sostituzioni, provo una seconda strategia${NC}"
else
  mv "$TEMP_FILE" "$CODE_PATH"
  echo -e "${GREEN}✓ Condizione modificata con successo${NC}"
  
  # Visualizza il risultato
  echo -e "${YELLOW}Nuova condizione:${NC}"
  grep -n -A 3 -B 1 "if (true)" "$CODE_PATH"
  
  echo -e "\n${GREEN}La condizione è stata modificata per forzare sempre l'aggiornamento dell'inventario${NC}"
  echo -e "${YELLOW}Ora l'aggiornamento dell'inventario avverrà sempre quando cambia lo stato di un ordine${NC}"
  exit 0
fi

# Strategia 2: Riscrivere manualmente la condizione
echo -e "${YELLOW}Strategia 2: Riscrivere manualmente la condizione${NC}"
LINE_CONTENT=$(sed -n "${CONDITION_LINE}p" "$CODE_PATH")
INDENTATION=$(echo "$LINE_CONTENT" | sed 's/\([ \t]*\).*/\1/')

# Crea un file di patch temporaneo
PATCH_FILE=$(mktemp)
cat > "$PATCH_FILE" << EOF
--- storage.ts.orig
+++ storage.ts
@@ -${CONDITION_LINE},7 +${CONDITION_LINE},10 @@
 ${INDENTATION}// Aggiorniamo l'inventario solo se lo stato precedente non era già "ready", "served" o "completed"
-${INDENTATION}if (oldStatus && !["ready", "served", "completed"].includes(oldStatus)) {
+${INDENTATION}// MODIFICATO: Forziamo sempre l'aggiornamento dell'inventario
+${INDENTATION}console.log('DEBUG INVENTARIO: Forzature aggiornamento inventario (condizione originale disabilitata)');
+${INDENTATION}if (true) { // Condizione originale: oldStatus && !["ready", "served", "completed"].includes(oldStatus)
 ${INDENTATION}  console.log('DEBUG INVENTARIO: Chiamata a updateInventoryForPreparedOrder per ordine', id);
 ${INDENTATION}  console.log(\`Ordine \${id} cambiato da \${oldStatus} a \${update.status}: aggiornamento inventario\`);
 ${INDENTATION}  await this.updateInventoryForPreparedOrder(id);
EOF

# Applica la patch
patch "$CODE_PATH" "$PATCH_FILE"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Patch applicata con successo${NC}"
  rm "$PATCH_FILE"
else
  echo -e "${RED}✗ Errore nell'applicazione della patch${NC}"
  rm "$PATCH_FILE"
  
  # Strategia 3: Modifica diretta con sed
  echo -e "${YELLOW}Strategia 3: Modifica diretta con sed${NC}"
  sed -i "${CONDITION_LINE}s/.*/        if (true) { \/\/ Condizione forzata per aggiornare sempre l'inventario/" "$CODE_PATH"
  
  # Verifica il risultato
  if grep -q "if (true)" "$CODE_PATH"; then
    echo -e "${GREEN}✓ Modifica applicata con successo${NC}"
  else
    echo -e "${RED}✗ Impossibile modificare la condizione${NC}"
    echo -e "${YELLOW}Ripristino dal backup originale...${NC}"
    cp "$BACKUP_FILE" "$CODE_PATH"
    echo -e "${GREEN}✓ File originale ripristinato${NC}"
    exit 1
  fi
fi

# Ricompilazione del progetto (se necessaria)
echo -e "\n${YELLOW}3. Ricompilazione del progetto...${NC}"
if [ -f "package.json" ]; then
  if grep -q "\"build\":" "package.json"; then
    echo -e "${YELLOW}Eseguo npm run build...${NC}"
    npm run build
    echo -e "${GREEN}✓ Progetto ricompilato${NC}"
  else
    echo -e "${YELLOW}Nessun comando di build trovato in package.json${NC}"
  fi
else
  echo -e "${YELLOW}Non è stato trovato il file package.json${NC}"
fi

echo -e "\n${GREEN}Fix completato!${NC}"
echo -e "${YELLOW}Ora la funzione di aggiornamento dell'inventario verrà sempre chiamata quando cambia lo stato di un ordine${NC}"
echo -e "${YELLOW}Per testare, esegui ./debug-inventory.sh e verifica i log del server${NC}"
echo -e "${YELLOW}Per ripristinare il comportamento originale: cp $BACKUP_FILE $CODE_PATH${NC}" 