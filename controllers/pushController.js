import dotenv from 'dotenv';
dotenv.config();

import webpush from "web-push";
import Subscription from '../models/Subscription.js';

if (!process.env.PRIVATE_VAPID_KEY || !process.env.PUBLIC_VAPID_KEY || !process.env.MAILTO) {
    throw new Error("ERREUR FATALE: Les clés VAPID ou l'email manquent dans le fichier .env");
}

webpush.setVapidDetails(
  process.env.MAILTO,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

export const subscribeUser = async (req, res) => {
  
  const { subscription, type } = req.body; 

  try {
    
    const updateFields = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      
      [`preferences.${type}`]: true 
    };

    
    await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { $set: updateFields }, 
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: `Abonnement ${type} activé !` });
    console.log(`✅ Préférence mise à jour pour : ${type}`);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const sendDailyPrayers = async () => {

  console.log("🚀 Envoi des rappels quotidiens...");

  try{
    const subscriptions = await Subscription.find({}).lean();

    if (subscriptions.length === 0) {
      console.log("Aucun abonné trouvé pour l'envoi des rappels.");
      return;
    }
    
    const payload = JSON.stringify({
      title: "تذكير يومي من يونس",
      body: "لا تنسَ الاطلاع على أدعيتك لهذه الليلة للمغفرة ذنوبك!",
      icon: '/Logo.png' 
    });

    const BATCH_SIZE = 100; 
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map((sub) => {
        return webpush.sendNotification(sub, payload)
          .then(() => { successCount++; })
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log(`Suppression abonné invalide: ${sub._id}`);
              return Subscription.deleteOne({ _id: sub._id });
            }
            console.error(`Erreur envoi (Status ${err.statusCode})`);
            failureCount++;
          });
      });

      await Promise.all(promises);
      console.log(`📦 Paquet ${Math.floor(i / BATCH_SIZE) + 1} envoyé.`);
    }

    console.log(`✅ Terminé ! Succès: ${successCount}, Échecs: ${failureCount}`);

  } catch (error) {
    console.error("Erreur lors de l'envoi des rappels :", error);
  }
}
export const sendFastingReminder = async () => {
  console.log("🌙 Envoi du rappel de jeûne (Lundi/Jeudi)...");

  try {
    const subscriptions = await Subscription.find({}).lean();

    if (subscriptions.length === 0) {
      console.log("Aucun abonné pour le rappel de jeûne.");
      return;
    }

    // Déterminer quel jour on annonce (Si on est Dimanche(0) -> Lundi, Sinon -> Jeudi)
    const today = new Date().getDay(); 
    const dayName = today === 0 ? "الاثنين" : "الخميس";

    const payload = JSON.stringify({
      title: "🌙 تذكير صيام النافلة",
      body: `غداً هو يوم ${dayName}، فرصة لإحياء سنة النبي ﷺ والصيام. لا تنسَ النية!`,
      icon: '/Logo.png'
    });

    const BATCH_SIZE = 100;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map((sub) => {
        return webpush.sendNotification(sub, payload)
          .then(() => { successCount++; })
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              return Subscription.deleteOne({ _id: sub._id });
            }
            failureCount++;
          });
      });

      await Promise.all(promises);
    }

    console.log(`✅ Rappel Jeûne envoyé ! Succès: ${successCount}, Échecs: ${failureCount}`);

  } catch (error) {
    console.error("Erreur rappel jeûne :", error);
  }
};