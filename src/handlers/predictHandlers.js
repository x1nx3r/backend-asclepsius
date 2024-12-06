const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { getFirestore } = require("firebase-admin/firestore");

// Existing predictClassification function
async function predictClassification(model, imagePath) {
  try {
    // Read the image file into a buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Decode the image buffer
    const tensor = tf.node
      .decodeImage(imageBuffer, 3) // 3 for RGB channels
      .resizeBilinear([224, 224]) // Use resizeBilinear instead of resizeNearestNeighbor
      .toFloat()
      .expandDims();

    const prediction = model.predict(tensor);
    const score = await prediction.data();
    const confidenceScore = score[0] * 100;

    let label, explanation, suggestion;

    if (score[0] > 0.5) {
      label = "Cancer";
      explanation = "The image is classified as Cancer.";
      suggestion =
        "Consult with a healthcare professional for further diagnosis and treatment.";
    } else {
      label = "Non-cancer";
      explanation = "The image is classified as Non-cancer.";
      suggestion =
        "No immediate action is required, but regular check-ups are recommended.";
    }

    return { confidenceScore, label, explanation, suggestion };
  } catch (error) {
    throw new Error(`Input error: ${error.message}`);
  }
}

// New predictHandler function
async function predictHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded.",
      });
    }

    const imagePath = path.join(__dirname, "../../uploads", req.file.filename);
    console.log(`Image path: ${imagePath}`);

    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      console.error("File does not exist:", imagePath);
      return res.status(500).json({
        status: "fail",
        message: "Internal Server Error: File not found",
      });
    }

    // Use sharp to check the image's color channels
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (metadata.channels !== 3) {
      return res.status(400).json({
        status: "fail",
        message: "Terjadi kesalahan dalam melakukan prediksi",
      });
    }

    const result = await predictClassification(req.model, imagePath);

    const predictionId = uuidv4();
    const createdAt = new Date().toISOString();

    const response = {
      status: "success",
      message: "Model is predicted successfully",
      data: {
        id: predictionId,
        result: result.label,
        suggestion:
          result.label === "Cancer"
            ? "Segera periksa ke dokter!"
            : "Penyakit kanker tidak terdeteksi.",
        createdAt: createdAt,
      },
    };

    // Store the result in Firestore
    const db = getFirestore();
    await db
      .collection("predictions")
      .doc(predictionId)
      .set({
        id: predictionId,
        result: result.label,
        suggestion:
          result.label === "Cancer"
            ? "Segera periksa ke dokter!"
            : "Penyakit kanker tidak terdeteksi.",
        createdAt: createdAt,
      });

    // Send the response to the client
    res.status(201).json(response);

    // Delete the image file after sending the response
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully:", imagePath);
      }
    });
  } catch (error) {
    console.error("Error in prediction:", error);
    res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
    });
  }
}

// New getPredictionHistories function
async function getPredictionHistories(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("predictions").get();

    if (snapshot.empty) {
      return res.status(200).json({
        status: "success",
        data: [],
      });
    }

    const histories = snapshot.docs.map((doc) => ({
      id: doc.id,
      history: doc.data(),
    }));

    res.status(200).json({
      status: "success",
      data: histories,
    });
  } catch (error) {
    console.error("Error fetching prediction histories:", error);
    res.status(500).json({
      status: "fail",
      message: "Internal Server Error",
    });
  }
}

// Middleware to handle file size limit errors
function fileSizeLimitErrorHandler(err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      status: "fail",
      message: "Payload content length greater than maximum allowed: 1000000",
    });
  }
  next(err);
}

// Middleware to handle other errors
function generalErrorHandler(err, req, res, next) {
  console.error("General error:", err);
  res.status(500).json({
    status: "fail",
    message: "Internal Server Error",
  });
}

const colorChannelsErrorHandler = async (req, res, next) => {
  try {
    // Assuming the image path is available in req.file.path
    const imagePath = req.file.path;

    // Use sharp to check the image's color channels
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (metadata.channels !== 3) {
      // Delete the uploaded file if it doesn't meet the requirements
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete the file:", err);
        }
      });

      return res.status(400).json({
        status: "fail",
        message: "Terjadi kesalahan dalam melakukan prediksi",
      });
    }

    // If the image has 3 color channels, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Error processing the image:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  predictHandler,
  getPredictionHistories,
  fileSizeLimitErrorHandler,
  generalErrorHandler,
  colorChannelsErrorHandler,
};
