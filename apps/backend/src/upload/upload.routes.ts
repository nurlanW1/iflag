import express from "express";
import { put } from "@vercel/blob";
import pool from "../db.js";

const router = express.Router();

router.post("/flag", async (req, res) => {
  try {
    const { name, country, file } = req.body;

    // base64 file decode
    const buffer = Buffer.from(file, "base64");

    // Blob ga upload
    const blob = await put(`flags/${name}.svg`, buffer, {
      access: "public",
    });

    // DB ga yozish
    await pool.query(
      "INSERT INTO flags (name, country, file_url) VALUES ($1, $2, $3)",
      [name, country, blob.url]
    );

    res.json({
      success: true,
      url: blob.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;