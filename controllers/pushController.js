import webpush from "web-push";
import Subscription from '../models/Subscription.js';

// --- CONFIGURATION ---
// Vérification stricte des variables d'environnement
if (!process.env.PRIVATE_VAPID_KEY || !process.env.PUBLIC_VAPID_KEY || !process.env.MAILTO) {
    console.error("❌ ERREUR: Variables VAPID manquantes dans .env");
}

try {
    webpush.setVapidDetails(
      process.env.MAILTO,
      process.env.PUBLIC_VAPID_KEY,
      process.env.PRIVATE_VAPID_KEY
    );
} catch (err) {
    console.error("❌ Erreur config VAPID:", err);
}

// --- 1. INSCRIPTION (Mise à jour des préférences) ---
export const subscribeUser = async (req, res) => {
  const { subscription, type } = req.body; 

  // Validation basique
  if (!subscription || !subscription.endpoint || !type) {
      return res.status(400).json({ error: 'Données manquantes' });
  }

  try {
    const updateFields = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      // On active spécifiquement la préférence demandée
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

// --- 2. ENVOI QUOTIDIEN (22h) ---
export const sendDailyPrayers = async () => {
  console.log("🚀 Envoi des rappels quotidiens (22h)...");

  try{
    // 👇 CRUCIAL : On filtre uniquement ceux qui veulent le Daily
    const subscriptions = await Subscription.find({ 'preferences.daily': true }).lean();

    if (subscriptions.length === 0) {
      console.log("Aucun abonné 'Daily' trouvé.");
      return;
    }
    
    const payload = JSON.stringify({
      title: "تذكير يومي من يونس",
      body: "لا تنسَ الاطلاع على أدعيتك لهذه الليلة للمغفرة ذنوبك!",
      icon: '/Logo.png' 
    });

    await sendNotificationsBatch(subscriptions, payload);

  } catch (error) {
    console.error("Erreur lors de l'envoi des rappels :", error);
  }
}

// --- 3. ENVOI JEÛNE (Dim/Mer) ---
export const sendFastingReminder = async () => {
  console.log("🌙 Envoi du rappel de jeûne...");

  try {
    // 👇 CRUCIAL : On filtre uniquement ceux qui veulent le Fasting
    const subscriptions = await Subscription.find({ 'preferences.fasting': true }).lean();

    if (subscriptions.length === 0) {
      console.log("Aucun abonné 'Fasting' trouvé.");
      return;
    }

    const today = new Date().getDay(); 
    const dayName = today === 0 ? "الاثنين" : "الخميس"; // 0 = Dimanche (pour Lundi)

    const payload = JSON.stringify({
      title: "🌙 تذكير صيام النافلة",
      body: `غداً هو يوم ${dayName}، فرصة لإحياء سنة النبي ﷺ والصيام. لا تنسَ النية!`,
      icon: '/Logo.png'
    });

    await sendNotificationsBatch(subscriptions, payload);

  } catch (error) {
    console.error("Erreur rappel jeûne :", error);
  }
};

// --- FONCTION UTILITAIRE POUR L'ENVOI EN MASSE ---
const sendNotificationsBatch = async (subscriptions, payload) => {
    const BATCH_SIZE = 100;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map((sub) => {
        return webpush.sendNotification(sub, payload)
          .then(() => { successCount++; })
          .catch(err => {
            // 410 = Gone (Utilisateur désabonné), 404 = Not Found
            if (err.statusCode === 410 || err.statusCode === 404) {
              return Subscription.deleteOne({ _id: sub._id });
            }
            failureCount++;
          });
      });

      await Promise.all(promises);
    }
    console.log(`✅ Envoi terminé ! Succès: ${successCount}, Échecs/Nettoyés: ${failureCount}`);
};
// --- 4. ENVOI JOURS BLANCS (13 - 14 - 15 Hijri) ---
export const sendWhiteDaysReminder = async () => {
  console.log("🌕 Envoi du rappel des jours blancs...");

  try {
    // On filtre seulement ceux qui ont activé 'whiteDays'
    const subscriptions = await Subscription.find({ 'preferences.whiteDays': true }).lean();

    if (subscriptions.length === 0) {
      console.log("Aucun abonné 'WhiteDays' trouvé.");
      return;
    }

    const payload = JSON.stringify({
      title: "🌕 تذكير أيام البيض",
      body: "غدًا تبدأ أيّامُ البِيض، وهي فرصةٌ عظيمة لاغتنام سُنّة صيام ثلاثة أيام من كل شهر، كأنك صمتَ الدهر كله! 🤲",
      icon: "/Logo.png"
    });

    await sendNotificationsBatch(subscriptions, payload);

  } catch (error) {
    console.error("Erreur rappel jours blancs :", error);
  }
};
