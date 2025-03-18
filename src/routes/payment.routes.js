import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { paymentSubscription } from '../controllers/payment.controller.js';
const paymentRouter = Router();
paymentRouter.use(verifyJWT); // Apply JWT verification to all routes

// Corrected route path
paymentRouter.route("/razorpay").post(paymentSubscription);


export default paymentRouter;
