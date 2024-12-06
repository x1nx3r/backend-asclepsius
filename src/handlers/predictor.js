const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");

// Predict classification
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
      label = "Non-Cancer";
      explanation = "The image is classified as Non-Cancer.";
      suggestion =
        "No immediate action is required, but regular check-ups are recommended.";
    }

    return { confidenceScore, label, explanation, suggestion };
  } catch (error) {
    throw new Error(`Input error: ${error.message}`);
  }
}

module.exports = { predictClassification };
