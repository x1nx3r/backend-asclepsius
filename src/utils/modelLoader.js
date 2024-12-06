const tf = require("@tensorflow/tfjs-node");
const https = require("https");
const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");

// URL of the zip file
const zipUrl =
  "https://storage.googleapis.com/asclepsius-backend-bucket/submissions-model.zip";
// Directory to unzip the model
const modelDir = path.resolve(__dirname, "../../model_dir");
// Path to the model.json file
const modelJsonPath = path.join(modelDir, "model.json");

// Download and unzip the model
async function downloadAndUnzipModel(url, outputDir) {
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Download the zip file
    await new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            return reject(
              new Error(`Failed to download file: ${response.statusMessage}`),
            );
          }

          // Unzip the file
          response
            .pipe(unzipper.Extract({ path: outputDir }))
            .on("close", resolve)
            .on("error", reject);
        })
        .on("error", reject);
    });

    console.log("Model downloaded and unzipped successfully");
  } catch (error) {
    console.error("Error downloading and unzipping model:", error);
    throw error;
  }
}

// Load the model
async function loadModel(modelPath) {
  try {
    // Check if the model.json file exists
    if (!fs.existsSync(modelJsonPath)) {
      console.log("Model not found locally, downloading...");
      await downloadAndUnzipModel(zipUrl, modelDir);
    } else {
      console.log("Model found locally, skipping download.");
    }

    const model = await tf.loadGraphModel(modelPath);
    return model;
  } catch (error) {
    console.error("Error loading model:", error);
    throw error;
  }
}

module.exports = { loadModel };
