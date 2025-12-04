import express from "express";
import { subscribeUser } from "../controllers/pushController.js";

const router = express.Router();


router.post("/subscribe", subscribeUser);

export default router;
