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
  const subscription = req.body;
  
  try {
    await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      subscription,
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Abonnement réussi !' });
    console.log("✅ Nouvel abonné enregistré.");
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
      title: "Rappel quotidien",
      body: "N'oubliez pas de consulter vos Duaa pour cette nuit !",
      icon: '/logo192.png' 
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