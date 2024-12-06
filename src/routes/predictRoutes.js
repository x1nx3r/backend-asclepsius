const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  predictHandler,
  getPredictionHistories,
} = require("../handlers/predictHandlers");

const router = express.Router();

// Configure multer to save files to the 'uploads' directory with the original file extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Set file size limit to 1MB
});

// Endpoint to handle image upload and prediction
router.post("/", upload.single("image"), predictHandler);

// Endpoint to get prediction histories
router.get("/histories", getPredictionHistories);

module.exports = router;
