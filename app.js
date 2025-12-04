import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';


import connectDB from './lib/db.js'; 
import reminderRoutes from './routes/reminderRoute.js';
import { sendDailyPrayers } from './controllers/pushController.js';

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json()); 

app.use('/api', reminderRoutes);

cron.schedule('45 5 * * *', () => {
  console.log("⏰ DRIIIIING ! Rappel envoyé à 3h38");
  sendDailyPrayers();
});
app.get('/api/test-notifications', async (req, res) => {
  try {
    console.log("🧪 Test manuel lancé...");
    await sendDailyPrayers();
    res.status(200).json({ message: 'Notifications envoyées avec succès !' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});