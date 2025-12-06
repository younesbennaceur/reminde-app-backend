import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import connectDB from './lib/db.js'; 
import reminderRoutes from './routes/reminderRoute.js';
import { sendDailyPrayers } from './controllers/pushController.js';
import { sendFastingReminder} from './controllers/pushController.js';
import { sendWhiteDaysReminder } from './controllers/pushController.js';
import axios from 'axios';

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json());

app.use('/api', reminderRoutes);

app.get('/', (req, res) => {
  res.send('Le serveur est en ligne ! 🚀');
});
cron.schedule('30 21 * * *', () => {
  console.log("⏰ 09h30 : Envoi des rappels d'Azkars du soir");
  sendDailyPrayers();
}, {
  scheduled: true,
  timezone: "Europe/Paris"
});



// --- CRON 2 : Rappel Jeûne (NOUVEAU) ---
// 0 19 * * 0,3  => À la minute 0, heure 19, tous les mois, uniquement le Dimanche(0) et Mercredi(3)
cron.schedule('0 19 * * 0,3', () => {
  console.log("🌙 19h00 (Dim/Mer) : Rappel de jeûne Sunnah");
  sendFastingReminder();
}, {
  scheduled: true,
  timezone: "Europe/Paris" // 
});



// Cron : vérifier TOUS LES JOURS à 8h si c’est un Jour Blanc
cron.schedule('* 19 * * *', async () => {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Format DD-MM-YYYY pour l’API
    const formatted = `${day}-${month}-${year}`;

    const response = await axios.get(`https://api.aladhan.com/v1/gToH?date=${formatted}`);
    const hijriDay = parseInt(response.data.data.hijri.day);

    console.log("📅 Jour Hijri :", hijriDay);

    // SI c'est 13 – 14 – 15 → envoyer rappel
    if ([12].includes(hijriDay)) {
      console.log("🌙 Aujourd’hui est un jour blanc ! Envoi rappel…");
      sendWhiteDaysReminder();
    }    

  } catch (err) {
    console.error("Erreur dans le cron Ayam Al-Bid :", err);
  }

}, {
  scheduled: true,
  timezone: "Europe/Paris"
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});