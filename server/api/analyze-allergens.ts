import { Request, Response } from "express";
import OpenAI from "openai";

// Inizializza l'API di OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface AllergenResponse {
  ingredient: string;
  allergens: {
    gluten: boolean;
    dairy: boolean;
    nuts: boolean;
    eggs: boolean;
    soy: boolean;
    shellfish: boolean;
    fish: boolean;
    peanuts: boolean;
  };
  confidence: number;
  description?: string;
}

export default async function analyzeAllergens(req: Request, res: Response) {
  try {
    // Verifica che l'API key sia configurata
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OpenAI API key non configurata. Imposta la variabile di ambiente OPENAI_API_KEY." 
      });
    }

    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "Fornire un array di ingredienti da analizzare" });
    }

    // Preparo il prompt per l'API di OpenAI
    const prompt = `
    Analizza i seguenti ingredienti e identifica quali allergeni contengono.
    Gli allergeni da considerare sono: glutine, lattosio, frutta a guscio, uova, soia, crostacei, pesce, arachidi.
    
    La tua risposta deve essere un oggetto JSON con una singola proprietà "results" che contiene un array di oggetti. Ogni oggetto deve avere la seguente struttura:
    {
      "results": [
        {
          "ingredient": "nome dell'ingrediente",
          "allergens": {
            "gluten": true/false,
            "dairy": true/false,
            "nuts": true/false,
            "eggs": true/false,
            "soy": true/false,
            "shellfish": true/false,
            "fish": true/false,
            "peanuts": true/false
          },
          "confidence": numero da 0 a 1,
          "description": "breve descrizione opzionale"
        }
      ]
    }
    
    Ingredienti da analizzare: ${ingredients.join(", ")}
    
    IMPORTANTE: La risposta DEVE essere un oggetto JSON valido con la struttura esatta indicata sopra, senza spiegazioni o testo aggiuntivo.
    `;

    // Chiamata all'API di OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Uso gpt-3.5-turbo che è più veloce e meno costoso
      messages: [
        { 
          role: "system", 
          content: "Sei un esperto nutrizionista specializzato nell'identificazione di allergeni negli alimenti. Rispondi SEMPRE con oggetti JSON validi secondo la struttura richiesta." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.1, // Temperatura più bassa per risultati ancora più deterministi
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content || "";
    console.log("Risposta ricevuta:", responseContent);
    
    // Valido la risposta come JSON
    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // Verifico che la risposta contenga la proprietà results e che sia un array
      if (!parsedResponse.results || !Array.isArray(parsedResponse.results) || parsedResponse.results.length === 0) {
        console.error("Formato di risposta non valido:", parsedResponse);
        return res.status(500).json({ 
          error: "Formato di risposta non valido",
          rawResponse: responseContent
        });
      }
      
      // Normalizzo la risposta
      const results: AllergenResponse[] = parsedResponse.results.map(normalizeResponse);
      
      return res.status(200).json(results);
    } catch (error) {
      console.error("Errore nel parsing della risposta di OpenAI:", error);
      console.log("Risposta ricevuta:", responseContent);
      
      // Tentativo di recupero: se la risposta è una stringa JSON racchiusa in ulteriori quote
      try {
        // A volte l'API restituisce una stringa contenente un JSON valido
        if (typeof responseContent === 'string' && responseContent.trim().startsWith('{')) {
          const cleanedContent = responseContent.replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          const parsedResponse = JSON.parse(cleanedContent);
          
          if (parsedResponse.results && Array.isArray(parsedResponse.results)) {
            const results: AllergenResponse[] = parsedResponse.results.map(normalizeResponse);
            return res.status(200).json(results);
          }
        }
      } catch (secondError) {
        console.error("Anche il tentativo di recupero è fallito:", secondError);
      }
      
      return res.status(500).json({ 
        error: "Errore nel parsing della risposta di OpenAI",
        rawResponse: responseContent
      });
    }
  } catch (error) {
    console.error("Errore durante l'analisi degli allergeni:", error);
    return res.status(500).json({ 
      error: "Errore durante l'analisi degli allergeni con OpenAI",
      message: error instanceof Error ? error.message : "Errore sconosciuto"
    });
  }
}

// Funzione per normalizzare la risposta in un formato coerente
function normalizeResponse(item: any): AllergenResponse {
  // Se item non è un oggetto o è null, creo un oggetto vuoto di default
  if (typeof item !== 'object' || item === null) {
    item = {};
  }
  
  // Se allergens non è un oggetto o è null, creo un oggetto vuoto di default
  if (typeof item.allergens !== 'object' || item.allergens === null) {
    item.allergens = {};
  }
  
  return {
    ingredient: item.ingredient || "",
    allergens: {
      gluten: !!item.allergens.gluten,
      dairy: !!item.allergens.dairy,
      nuts: !!item.allergens.nuts,
      eggs: !!item.allergens.eggs,
      soy: !!item.allergens.soy,
      shellfish: !!item.allergens.shellfish,
      fish: !!item.allergens.fish,
      peanuts: !!item.allergens.peanuts
    },
    confidence: typeof item.confidence === 'number' ? item.confidence : 0.7,
    description: item.description || ""
  };
} 