import express from "express";
import { subscribeUser, sendDailyPrayers } from "../controllers/pushController.js";

const router = express.Router();

router.post("/subscribe", subscribeUser);
  

export default router;