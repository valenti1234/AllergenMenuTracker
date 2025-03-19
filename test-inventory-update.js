// Script di test per verificare l'aggiornamento dell'inventario
// quando un piatto viene servito

// Per utilizzare import/export in Node.js
import "dotenv/config";
import mongoose from "mongoose";
import { storage } from "./server/storage.js";

async function testInventoryUpdateProcess() {
  try {
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
          console.log(`  ✓ Ingrediente creato con quantità negativa`);
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
    await mongoose.disconnect();
    console.log('Connessione al database chiusa');
  }
}

// Esegui il test
testInventoryUpdateProcess(); 