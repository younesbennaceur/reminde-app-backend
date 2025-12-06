import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import connectDB from './lib/db.js'; 
import reminderRoutes from './routes/reminderRoute.js';
import { sendDailyPrayers } from './controllers/pushController.js';
import { sendFastingReminder} from './controllers/pushController.js';

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json());

app.use('/api', reminderRoutes);

app.get('/', (req, res) => {
  res.send('Le serveur est en ligne ! 🚀');
});
cron.schedule('30 09 * * *', () => {
  console.log("⏰ 11h30 : Envoi des rappels d'Azkars du midi...");
  sendDailyPrayers();
}, {
  scheduled: true,
  timezone: "Europe/Paris"
});



// --- CRON 2 : Rappel Jeûne (NOUVEAU) ---
// 0 19 * * 0,3  => À la minute 0, heure 19, tous les mois, uniquement le Dimanche(0) et Mercredi(3)
cron.schedule('30 09 * * *', () => {
  console.log("🌙 19h00 (Dim/Mer) : Rappel de jeûne Sunnah");
  sendFastingReminder();
}, {
  scheduled: true,
  timezone: "Europe/Paris" // 
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});