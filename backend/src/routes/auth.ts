import express from "express";
import jwt from "jsonwebtoken";
import { getDB } from "../db/mongo.ts";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!process.env.USER_COLLECTION_NAME) {
      return res.status(500).json({
        message: "USER_COLLECTION_NAME environment variable is not set",
      });
    }

    const users = getDB().collection(process.env.USER_COLLECTION_NAME);

    const user = await users.findOne({
      email,
      password,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      },
    );

    return res.json({
      token,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
