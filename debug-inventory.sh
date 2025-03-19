#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configurazione
SERVER="http://localhost:5050"
COOKIES_FILE="cookies.txt"

echo -e "${GREEN}Debug aggiornamento inventario${NC}"
echo "=============================================="

# Autenticazione
echo -e "\n${YELLOW}1. Autenticazione...${NC}"
curl -s -X POST $SERVER/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"valenti1234", "password":"Itnelav3465#"}' \
  -c $COOKIES_FILE > /dev/null

echo -e "${GREEN}✓ Autenticazione completata${NC}"

# Ottieni menu items disponibili
echo -e "\n${YELLOW}2. Ottengo menu items...${NC}"
MENU_RESPONSE=$(curl -s -b $COOKIES_FILE $SERVER/api/menu \
  -H "Accept: application/json")

# Estrai e mostra tutti i menu item IDs
echo -e "${YELLOW}Menu items disponibili:${NC}"
echo "$MENU_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | nl

# Chiedi all'utente di scegliere un menu item
echo -e "\n${YELLOW}Inserisci il numero del menu item da utilizzare:${NC}"
read -r MENU_ITEM_NUM
MENU_ITEM_ID=$(echo "$MENU_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | sed -n "${MENU_ITEM_NUM}p")

if [ -z "$MENU_ITEM_ID" ]; then
  echo -e "${RED}✗ Menu item non valido${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Menu item selezionato: $MENU_ITEM_ID${NC}"

# 3. Visualizza la mappatura ricetta esistente
echo -e "\n${YELLOW}3. Visualizzo mappatura ricetta...${NC}"
RECIPE_RESPONSE=$(curl -s -b $COOKIES_FILE $SERVER/api/recipe-mappings/$MENU_ITEM_ID \
  -H "Accept: application/json")

if [[ $RECIPE_RESPONSE == *"Recipe mapping not found"* ]] || [[ $RECIPE_RESPONSE == *"null"* ]]; then
  echo -e "${RED}✗ Nessuna mappatura ricetta esistente${NC}"
  
  # Chiedi all'utente se vuole creare una mappatura
  echo -e "${YELLOW}Vuoi creare una mappatura ricetta? (s/n)${NC}"
  read -r CREATE_MAPPING
  
  if [[ $CREATE_MAPPING == "s" ]]; then
    echo -e "${YELLOW}Creo una mappatura ricetta di test...${NC}"
    RECIPE_CREATE=$(curl -s -X PUT -b $COOKIES_FILE $SERVER/api/recipe-mappings/$MENU_ITEM_ID \
      -H "Content-Type: application/json" \
      -d "{\"ingredients\":[{\"name\":\"Ingrediente Debug Test\",\"quantity\":0.5,\"unit\":\"kg\"},{\"name\":\"Ingrediente Debug Test 2\",\"quantity\":3,\"unit\":\"pz\"}]}")
    
    echo -e "${GREEN}✓ Mappatura ricetta creata${NC}"
    RECIPE_RESPONSE=$(curl -s -b $COOKIES_FILE $SERVER/api/recipe-mappings/$MENU_ITEM_ID \
      -H "Accept: application/json")
  else
    echo -e "${RED}✗ Senza mappatura ricetta non è possibile testare l'aggiornamento dell'inventario${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Mappatura ricetta esistente${NC}"
fi

# Mostra i dettagli della mappatura
echo -e "${YELLOW}Dettagli mappatura:${NC}"
echo "$RECIPE_RESPONSE" | grep -o '"ingredients":\[[^]]*\]'

# 4. Controlla l'inventario prima
echo -e "\n${YELLOW}4. Controllo inventario prima dell'aggiornamento...${NC}"
INVENTORY_BEFORE=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# Estrai i nomi degli ingredienti dalla mappatura
INGREDIENTS=$(echo "$RECIPE_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

echo -e "${YELLOW}Ingredienti da monitorare:${NC}"
echo "$INGREDIENTS"

# Verifica se gli ingredienti esistono già nell'inventario
for INGREDIENT in $INGREDIENTS; do
  echo -e "\n${YELLOW}Cerco $INGREDIENT nell'inventario...${NC}"
  FOUND=$(echo "$INVENTORY_BEFORE" | grep -i "\"name\":\"$INGREDIENT\"")
  
  if [ -z "$FOUND" ]; then
    echo -e "${YELLOW}$INGREDIENT non trovato nell'inventario${NC}"
  else
    QUANTITY=$(echo "$FOUND" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
    UNIT=$(echo "$FOUND" | grep -o '"unit":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}$INGREDIENT: $QUANTITY $UNIT${NC}"
  fi
done

# 5. Crea un nuovo ordine di test
echo -e "\n${YELLOW}5. Creo un nuovo ordine di test...${NC}"
ORDER_JSON="{\"type\":\"dine-in\",\"phoneNumber\":\"1234567890\",\"customerName\":\"Debug Test\",\"tableNumber\":\"99\",\"items\":[{\"menuItemId\":\"$MENU_ITEM_ID\",\"name\":{\"en\":\"Debug Test\",\"it\":\"Test Debug\",\"es\":\"Test Debug\"},\"quantity\":1}]}"

echo -e "${YELLOW}JSON ordine: $ORDER_JSON${NC}"

ORDER_CREATE=$(curl -s -X POST -b $COOKIES_FILE $SERVER/api/orders \
  -H "Content-Type: application/json" \
  -d "$ORDER_JSON")

# Estrai l'ID dell'ordine
ORDER_ID=$(echo $ORDER_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}✗ Errore nella creazione dell'ordine${NC}"
  echo "Risposta: $ORDER_CREATE"
  exit 1
fi

echo -e "${GREEN}✓ Ordine creato con ID: $ORDER_ID${NC}"

# 6. Cambia lo stato dell'ordine a "ready"
echo -e "\n${YELLOW}6. Aggiorno lo stato dell'ordine a \"ready\"...${NC}"
STATUS_UPDATE=$(curl -s -X PATCH -b $COOKIES_FILE $SERVER/api/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"ready\"}")

echo -e "${GREEN}✓ Stato ordine aggiornato a ready${NC}"

# Attendi l'aggiornamento dell'inventario
echo -e "\n${YELLOW}Attendo 3 secondi per l'aggiornamento dell'inventario...${NC}"
sleep 3

# 7. Controlla l'inventario dopo
echo -e "\n${YELLOW}7. Controllo inventario dopo l'aggiornamento...${NC}"
INVENTORY_AFTER=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# Verifica se gli ingredienti sono stati aggiornati
for INGREDIENT in $INGREDIENTS; do
  echo -e "\n${YELLOW}Cerco $INGREDIENT nell'inventario aggiornato...${NC}"
  FOUND_AFTER=$(echo "$INVENTORY_AFTER" | grep -i "\"name\":\"$INGREDIENT\"")
  
  if [ -z "$FOUND_AFTER" ]; then
    echo -e "${RED}$INGREDIENT non trovato nell'inventario aggiornato${NC}"
  else
    QUANTITY_AFTER=$(echo "$FOUND_AFTER" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
    UNIT_AFTER=$(echo "$FOUND_AFTER" | grep -o '"unit":"[^"]*"' | cut -d'"' -f4)
    
    # Trova la quantità prima dell'aggiornamento
    FOUND_BEFORE=$(echo "$INVENTORY_BEFORE" | grep -i "\"name\":\"$INGREDIENT\"")
    
    if [ -z "$FOUND_BEFORE" ]; then
      echo -e "${GREEN}$INGREDIENT: $QUANTITY_AFTER $UNIT_AFTER (nuovo ingrediente)${NC}"
    else
      QUANTITY_BEFORE=$(echo "$FOUND_BEFORE" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
      echo -e "${GREEN}$INGREDIENT: $QUANTITY_AFTER $UNIT_AFTER (era: $QUANTITY_BEFORE)${NC}"
      
      # Verifica se la quantità è cambiata
      if [ "$QUANTITY_AFTER" != "$QUANTITY_BEFORE" ]; then
        echo -e "${GREEN}✓ La quantità è stata aggiornata${NC}"
      else
        echo -e "${RED}✗ La quantità NON è stata aggiornata${NC}"
      fi
    fi
  fi
done

# 8. Cambia lo stato dell'ordine a "completed" e verifica di nuovo
echo -e "\n${YELLOW}8. Aggiorno lo stato dell'ordine a \"completed\"...${NC}"
COMPLETE_UPDATE=$(curl -s -X PATCH -b $COOKIES_FILE $SERVER/api/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"completed\"}")

echo -e "${GREEN}✓ Stato ordine aggiornato a completed${NC}"

# Attendi l'aggiornamento dell'inventario
echo -e "\n${YELLOW}Attendo 3 secondi per l'aggiornamento dell'inventario...${NC}"
sleep 3

# 9. Controlla l'inventario dopo il secondo cambio di stato
echo -e "\n${YELLOW}9. Controllo inventario dopo il secondo cambio di stato...${NC}"
INVENTORY_FINAL=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# 10. Pulizia - elimina l'ordine di test
echo -e "\n${YELLOW}10. Pulizia - elimino l'ordine di test...${NC}"
DELETE_ORDER=$(curl -s -X DELETE -b $COOKIES_FILE $SERVER/api/orders/$ORDER_ID)

echo -e "${GREEN}Test di debug completato!${NC}" 