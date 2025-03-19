// Script di test per verificare l'aggiornamento dell'inventario
// quando un piatto viene servito (versione CommonJS)

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Inizializzazione manuale delle variabili di storage
let storage;

async function setup() {
  // Verifico che i file esistano
  const dbPath = path.join(process.cwd(), 'server', 'db.ts');
  const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`File non trovato: ${dbPath}`);
    console.log('Directory corrente:', process.cwd());
    console.log('Contenuto directory server:');
    try {
      const files = fs.readdirSync(path.join(process.cwd(), 'server'));
      console.log(files);
    } catch (err) {
      console.error('Errore nel leggere la directory server:', err);
    }
    throw new Error('File db.ts non trovato');
  }
  
  // Considerando che stiamo utilizzando file .ts, potremmo aver bisogno di un approccio diverso
  // con ts-node o tsc se è disponibile, per ora proviamo ad importare i moduli
  try {
    // Setup per caricamento dei modelli mongoose
    const db = require(dbPath);
    console.log('File db.ts caricato correttamente');
    
    // Importazione di storage dopo che i modelli sono caricati
    if (!fs.existsSync(storagePath)) {
      console.error(`File non trovato: ${storagePath}`);
      throw new Error('File storage.ts non trovato');
    }
    
    const storageModule = require(storagePath);
    storage = storageModule.storage;
    
    if (!storage) {
      throw new Error('Oggetto storage non trovato nel modulo');
    }
  } catch (error) {
    console.error('Errore nel caricare i moduli TypeScript:', error);
    throw new Error('Impossibile caricare i moduli TypeScript. È necessario installare ts-node o compilare i file TypeScript prima dell\'esecuzione.');
  }
}

async function testInventoryUpdateProcess() {
  try {
    // Setup preliminare
    await setup();
    
    // 1. Connessione al database
    console.log('Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('Connesso al database');

    // 2. Ottieni un menu item esistente per l'ordine
    console.log('\nOttengo un menu item esistente...');
    const menuItems = await storage.getMenuItems();
    if (menuItems.length === 0) {
      throw new Error('Nessun menu item trovato nel database');
    }
    const testMenuItem = menuItems[0];
    console.log(`Menu item selezionato: ${testMenuItem.id} - ${testMenuItem.name.it || testMenuItem.name.en}`);

    // 3. Assicurati che esista una mappatura ricetta per il menu item
    console.log('\nVerifica della mappatura ricetta...');
    let recipeMapping = await storage.getRecipeMapping(testMenuItem.id);
    
    if (!recipeMapping) {
      console.log('Nessuna mappatura ricetta trovata, ne creo una di test');
      const testIngredients = [
        { name: "Ingrediente Test 1", quantity: 0.2, unit: "kg" },
        { name: "Ingrediente Test 2", quantity: 2, unit: "pz" }
      ];
      recipeMapping = await storage.createRecipeMapping(testMenuItem.id, testIngredients, false);
      console.log('Mappatura ricetta creata');
    }
    
    console.log(`Mappatura ricetta per ${testMenuItem.id} trovata con ${recipeMapping.ingredients.length} ingredienti`);
    recipeMapping.ingredients.forEach(ing => {
      console.log(`- ${ing.name}: ${ing.quantity} ${ing.unit}`);
    });

    // 4. Controlla la situazione attuale dell'inventario
    console.log('\nSituazione attuale degli ingredienti nell\'inventario:');
    const beforeInventory = {};
    for (const ingredient of recipeMapping.ingredients) {
      const regex = new RegExp(`^${ingredient.name}$`, 'i');
      const items = await mongoose.model('Inventory').find({ name: regex });
      const item = items[0];
      
      if (item) {
        beforeInventory[ingredient.name] = {
          id: item._id.toString(),
          quantity: item.quantity,
          unit: item.unit
        };
        console.log(`- ${ingredient.name}: ${item.quantity} ${item.unit}`);
      } else {
        console.log(`- ${ingredient.name}: non presente nell'inventario`);
      }
    }

    // 5. Crea un nuovo ordine di test
    console.log('\nCreazione di un nuovo ordine di test...');
    const testOrder = {
      type: "dine-in",
      phoneNumber: "1234567890",
      customerName: "Cliente Test",
      tableNumber: "42",
      items: [
        {
          menuItemId: testMenuItem.id,
          quantity: 2,
          specialInstructions: "Test per aggiornamento inventario"
        }
      ],
      specialInstructions: "Ordine di test per aggiornamento inventario"
    };

    const createdOrder = await storage.createOrder(testOrder);
    console.log(`Ordine creato con ID: ${createdOrder.id}`);

    // 6. Cambia lo stato dell'ordine a "ready"
    console.log('\nAggiornamento stato ordine a "ready"...');
    const updatedOrder = await storage.updateOrder(createdOrder.id, { status: "ready" });
    console.log(`Stato ordine aggiornato a: ${updatedOrder.status}`);

    // 7. Controlla la nuova situazione dell'inventario dopo l'aggiornamento
    console.log('\nNuova situazione degli ingredienti nell\'inventario:');
    const afterInventory = {};
    
    // Attendi un momento per assicurarsi che l'aggiornamento dell'inventario sia completato
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (const ingredient of recipeMapping.ingredients) {
      const regex = new RegExp(`^${ingredient.name}$`, 'i');
      const items = await mongoose.model('Inventory').find({ name: regex });
      const item = items[0];
      
      if (item) {
        afterInventory[ingredient.name] = {
          id: item._id.toString(),
          quantity: item.quantity,
          unit: item.unit
        };
        
        // Calcola la differenza attesa
        const expectedDiff = ingredient.quantity * testOrder.items[0].quantity;
        const before = beforeInventory[ingredient.name] ? beforeInventory[ingredient.name].quantity : 0;
        const expected = before - expectedDiff;
        
        console.log(`- ${ingredient.name}: ${item.quantity} ${item.unit} (era: ${before}, atteso: ${expected})`);
        
        if (beforeInventory[ingredient.name]) {
          if (item.quantity === expected) {
            console.log(`  ✓ Quantità aggiornata correttamente`);
          } else {
            console.log(`  ✗ Quantità non aggiornata correttamente. Atteso: ${expected}, Attuale: ${item.quantity}`);
          }
        } else {
          const expectedNegative = -expectedDiff;
          if (item.quantity === expectedNegative) {
            console.log(`  ✓ Ingrediente creato con quantità negativa corretta (${expectedNegative})`);
          } else {
            console.log(`  ✗ Ingrediente creato con quantità negativa errata. Atteso: ${expectedNegative}, Attuale: ${item.quantity}`);
          }
        }
      } else {
        console.log(`- ${ingredient.name}: non trovato nell'inventario dopo l'aggiornamento (ERRORE)`);
      }
    }

    // 8. Rimuovi i dati di test
    console.log('\nPulizia dati di test...');
    await mongoose.model('Order').findByIdAndDelete(createdOrder.id);
    console.log(`Ordine di test eliminato`);
    
    console.log('\nTest completato con successo!');
  } catch (error) {
    console.error('Errore durante il test:', error);
  } finally {
    // Chiusura della connessione al database
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Connessione al database chiusa');
      }
    } catch (err) {
      console.error('Errore nella chiusura della connessione al database:', err);
    }
  }
}

// Esegui il test
testInventoryUpdateProcess(); 