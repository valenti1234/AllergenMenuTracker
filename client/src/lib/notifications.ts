/**
 * Richiede il permesso per le notifiche del browser
 * @returns Promise<boolean> - true se il permesso è stato concesso, false altrimenti
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Questo browser non supporta le notifiche desktop');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Errore nella richiesta di permesso per le notifiche:', error);
    return false;
  }
}

/**
 * Invia una notifica del browser
 * @param title - Titolo della notifica
 * @param body - Corpo della notifica
 * @param onClick - Funzione da eseguire quando l'utente clicca sulla notifica
 */
export function sendNotification(
  title: string, 
  body: string, 
  onClick?: () => void
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifiche non supportate o permesso non concesso');
    return;
  }
  
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    
    if (onClick) {
      notification.onclick = () => {
        notification.close();
        onClick();
      };
    }
  } catch (error) {
    console.error('Errore nell\'invio della notifica:', error);
  }
} 