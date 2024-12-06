const express = require("express");
const path = require("path");
const cors = require("cors");
const { loadModel } = require("./utils/modelLoader");
const predictRoutes = require("./routes/predictRoutes");
const {
  fileSizeLimitErrorHandler,
  generalErrorHandler,
} = require("./handlers/predictHandlers");

// Load environment variables from .env file
require("dotenv").config();

// Firebase Admin SDK initialization
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require(path.resolve(__dirname, "../SAKey.json"));
console.log("Using Service Account Credentials");
initializeApp();

// Set Firestore and Storage instances as global variables
const db = getFirestore();

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

let model;

// Load the model before starting the server
async function initializeModel() {
  try {
    const modelPath = `file://${path.resolve(__dirname, "../model_dir/model.json")}`; // Path to your model
    model = await loadModel(modelPath);
    console.log("Model loaded successfully");
  } catch (error) {
    console.error("Error loading model:", error);
  }
}

// Use the predict routes
app.use(
  "/predict",
  (req, res, next) => {
    req.model = model;
    next();
  },
  predictRoutes,
);

// Error handling middleware
app.use(fileSizeLimitErrorHandler);
app.use(generalErrorHandler);

// Start the server after the model is loaded
initializeModel().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
