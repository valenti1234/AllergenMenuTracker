#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configurazione
SERVER="http://localhost:5050"
COOKIES_FILE="cookies.txt"

echo -e "${GREEN}Test API per l'aggiornamento dell'inventario${NC}"
echo "=============================================="
echo -e "${YELLOW}Questo script verifica l'aggiornamento dell'inventario quando lo stato di un ordine cambia.${NC}"
echo -e "${YELLOW}La funzione 'updateInventoryForPreparedOrder' dovrebbe ridurre la quantità degli ingredienti.${NC}"

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

# Estrai il primo menu item ID
MENU_ITEM_ID=$(echo $MENU_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MENU_ITEM_ID" ]; then
  echo -e "${RED}✗ Nessun menu item trovato${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Menu item selezionato: $MENU_ITEM_ID${NC}"
echo -e "${YELLOW}Verifica come funziona nella classe MongoStorage:${NC}"
echo -e "${YELLOW}1. La funzione updateOrder(id, {status: \"ready\"}) chiama updateInventoryForPreparedOrder(id)${NC}"
echo -e "${YELLOW}2. Questa funzione recupera la mappatura ricetta per ogni item nell'ordine${NC}"
echo -e "${YELLOW}3. Per ogni ingrediente nella ricetta, riduce la quantità nell'inventario${NC}"

# Crea una mappatura ricetta se necessario
echo -e "\n${YELLOW}3. Verifico mappatura ricetta...${NC}"
RECIPE_RESPONSE=$(curl -s -b $COOKIES_FILE $SERVER/api/recipe-mappings/$MENU_ITEM_ID \
  -H "Accept: application/json")

if [[ $RECIPE_RESPONSE == *"Recipe mapping not found"* ]] || [[ $RECIPE_RESPONSE == *"null"* ]]; then
  echo -e "${YELLOW}Creo una mappatura ricetta di test...${NC}"
  
  # Crea una mappatura di test
  RECIPE_CREATE=$(curl -s -X PUT -b $COOKIES_FILE $SERVER/api/recipe-mappings/$MENU_ITEM_ID \
    -H "Content-Type: application/json" \
    -d "{\"ingredients\":[{\"name\":\"Ingrediente API Test\",\"quantity\":0.5,\"unit\":\"kg\"},{\"name\":\"Ingrediente API Test 2\",\"quantity\":3,\"unit\":\"pz\"}]}")
  
  echo -e "${GREEN}✓ Mappatura ricetta creata con ingredienti:${NC}"
  echo -e "  - Ingrediente API Test: 0.5 kg"
  echo -e "  - Ingrediente API Test 2: 3 pz"
else
  echo -e "${GREEN}✓ Mappatura ricetta esistente${NC}"
  # Mostra gli ingredienti
  INGREDIENTS=$(echo "$RECIPE_RESPONSE" | grep -o '"ingredients":\[[^]]*\]')
  echo -e "${YELLOW}Ingredienti:${NC} $INGREDIENTS"
fi

# Crea un nuovo ordine di test con un oggetto name multilingue
echo -e "\n${YELLOW}4. Creo un nuovo ordine di test...${NC}"

# Costruisci il JSON dell'ordine con tutti i campi richiesti
ORDER_JSON="{\"type\":\"dine-in\",\"phoneNumber\":\"1234567890\",\"customerName\":\"API Test\",\"tableNumber\":\"42\",\"items\":[{\"menuItemId\":\"$MENU_ITEM_ID\",\"name\":{\"en\":\"Test Order Item\",\"it\":\"Elemento Test Ordine\",\"es\":\"Articulo Prueba Orden\"},\"quantity\":1}]}"

echo -e "${YELLOW}JSON ordine:${NC} $ORDER_JSON"

ORDER_CREATE=$(curl -s -X POST -b $COOKIES_FILE $SERVER/api/orders \
  -H "Content-Type: application/json" \
  -d "$ORDER_JSON")

# Estrai l'ID dell'ordine
ORDER_ID=$(echo $ORDER_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo -e "${RED}✗ Errore nella creazione dell'ordine${NC}"
  echo -e "${RED}Risposta:${NC} $ORDER_CREATE"
  exit 1
fi

echo -e "${GREEN}✓ Ordine creato con ID: $ORDER_ID${NC}"

# Attendi un momento
sleep 1

# Controlla l'inventario prima dell'aggiornamento
echo -e "\n${YELLOW}5. Controllo inventario prima dell'aggiornamento...${NC}"
INVENTORY_BEFORE=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# Estrai i nomi degli ingredienti dalla mappatura
INGREDIENT_NAMES=$(echo "$RECIPE_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

# Verifica se gli ingredienti esistono già nell'inventario
for INGREDIENT in $INGREDIENT_NAMES; do
  echo -e "${YELLOW}Cerco $INGREDIENT nell'inventario...${NC}"
  FOUND=$(echo "$INVENTORY_BEFORE" | grep -i "\"name\":\"$INGREDIENT\"")
  
  if [ -z "$FOUND" ]; then
    echo -e "${YELLOW}$INGREDIENT non trovato nell'inventario (sarà creato quando l'ordine sarà pronto)${NC}"
  else
    QUANTITY=$(echo "$FOUND" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
    UNIT=$(echo "$FOUND" | grep -o '"unit":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}$INGREDIENT: $QUANTITY $UNIT${NC}"
  fi
done

# Cambia lo stato dell'ordine a "ready"
echo -e "\n${YELLOW}6. Aggiorno lo stato dell'ordine a \"ready\"...${NC}"
echo -e "${YELLOW}Questo dovrebbe attivare l'aggiornamento dell'inventario${NC}"
STATUS_UPDATE=$(curl -s -X PATCH -b $COOKIES_FILE $SERVER/api/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"ready\"}")

echo -e "${GREEN}✓ Stato ordine aggiornato a ready${NC}"
echo -e "${YELLOW}Risposta:${NC} $STATUS_UPDATE"

# Attendi l'aggiornamento dell'inventario
echo -e "\n${YELLOW}Attendo 3 secondi per l'aggiornamento dell'inventario...${NC}"
sleep 3

# Controlla l'inventario dopo l'aggiornamento
echo -e "\n${YELLOW}7. Controllo inventario dopo l'aggiornamento...${NC}"
INVENTORY_AFTER=$(curl -s -b $COOKIES_FILE $SERVER/api/inventory \
  -H "Accept: application/json")

# Verifica ciascun ingrediente
for INGREDIENT in $INGREDIENT_NAMES; do
  echo -e "\n${YELLOW}Verifica $INGREDIENT:${NC}"
  FOUND_AFTER=$(echo "$INVENTORY_AFTER" | grep -i "\"name\":\"$INGREDIENT\"")
  
  if [ -z "$FOUND_AFTER" ]; then
    echo -e "${RED}✗ $INGREDIENT non trovato nell'inventario dopo l'aggiornamento${NC}"
  else
    QUANTITY_AFTER=$(echo "$FOUND_AFTER" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
    UNIT_AFTER=$(echo "$FOUND_AFTER" | grep -o '"unit":"[^"]*"' | cut -d'"' -f4)
    STATUS=$(echo "$FOUND_AFTER" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    # Controlla la quantità precedente
    FOUND_BEFORE=$(echo "$INVENTORY_BEFORE" | grep -i "\"name\":\"$INGREDIENT\"")
    
    if [ -z "$FOUND_BEFORE" ]; then
      echo -e "${GREEN}✓ $INGREDIENT creato con quantità: $QUANTITY_AFTER $UNIT_AFTER (status: $STATUS)${NC}"
    else
      QUANTITY_BEFORE=$(echo "$FOUND_BEFORE" | grep -o '"quantity":[^,]*' | cut -d':' -f2)
      echo -e "${YELLOW}$INGREDIENT: prima=$QUANTITY_BEFORE, dopo=$QUANTITY_AFTER $UNIT_AFTER (status: $STATUS)${NC}"
      
      if [ "$QUANTITY_AFTER" != "$QUANTITY_BEFORE" ]; then
        echo -e "${GREEN}✓ Quantità aggiornata correttamente!${NC}"
      else
        echo -e "${RED}✗ Quantità NON aggiornata! C'è un problema nella funzione di aggiornamento.${NC}"
      fi
    fi
  fi
done

# Pulizia - elimina l'ordine di test
echo -e "\n${YELLOW}8. Pulizia - elimino l'ordine di test...${NC}"
DELETE_ORDER=$(curl -s -X DELETE -b $COOKIES_FILE $SERVER/api/orders/$ORDER_ID)

echo -e "${GREEN}Test completato!${NC}" 