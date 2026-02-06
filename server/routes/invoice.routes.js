import express from "express";
import {
  getInvoiceSettings,
  updateInvoiceSettings,
  getOrderForInvoice,
  listManualInvoices,
  createManualInvoice,
  getManualInvoiceForView,
  updateManualInvoice,
  deleteManualInvoice,
} from "../controllers/invoice.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin only
router.get("/settings", verifyJWTToken, isAdmin, getInvoiceSettings);
router.put("/settings", verifyJWTToken, isAdmin, updateInvoiceSettings);
router.get("/order/:orderId", verifyJWTToken, isAdmin, getOrderForInvoice);

// Manual invoices (kisi bhi cheez ke liye)
router.get("/manual", verifyJWTToken, isAdmin, listManualInvoices);
router.post("/manual", verifyJWTToken, isAdmin, createManualInvoice);
router.get("/manual/:id", verifyJWTToken, isAdmin, getManualInvoiceForView);
router.put("/manual/:id", verifyJWTToken, isAdmin, updateManualInvoice);
router.delete("/manual/:id", verifyJWTToken, isAdmin, deleteManualInvoice);

export default router;
