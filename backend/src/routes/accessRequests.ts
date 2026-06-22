import express, { type Request, type Response } from "express";

import {
  createAccessRequest,
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "../services/accessRequests.ts";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";
import { sendApprovalEmail } from "../utils/email.ts";

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public — submission from the request-access form.
router.post("/", async (req: Request, res: Response) => {
  try {
    const { fullName, email, useCase } = req.body ?? {};

    if (!fullName?.trim() || !email?.trim()) {
      return res
        .status(400)
        .json({ message: "Full name and email are required" });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    await createAccessRequest({ fullName, email, useCase });

    return res.status(201).json({ message: "Access request submitted" });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Admin — list every request for the dashboard.
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    try {
      const requests = await listAccessRequests();
      return res.json({ requests });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Admin — approve a request, provision the user, and email the credentials.
router.post(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { email, password } = await approveAccessRequest(req.params.id);
      const loginUrl =
        process.env.APP_LOGIN_URL ?? "http://localhost:5173/login";

      // The user is already provisioned; an email failure is reported but not
      // rolled back, since the password is persisted and recoverable.
      let emailDelivered = false;
      let emailError: string | null = null;
      try {
        const result = await sendApprovalEmail({
          to: email,
          password,
          loginUrl,
        });
        emailDelivered = result.delivered;
      } catch (err) {
        emailError =
          err instanceof Error ? err.message : "Failed to send email";
        console.error("Failed to send approval email:", err);
      }

      return res.json({
        message: "Access request approved",
        email,
        emailDelivered,
        emailError,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Admin — reject a request.
router.post(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      await rejectAccessRequest(req.params.id);
      return res.json({ message: "Access request rejected" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
