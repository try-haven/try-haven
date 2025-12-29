import * as tf from '@tensorflow/tfjs';
import { NYCApartmentListing } from './data';
import { extractFeatures, calculateFeatureStats, prepareTrainingData, FeatureStats } from './ml-features';

export interface ModelWeights {
  weights: number[][]; // Dense layer weights
  biases: number[]; // Dense layer biases
  featureStats: FeatureStats; // For normalization during prediction
  trainedAt: string; // ISO timestamp
  trainingSize: number; // Number of examples used
  accuracy?: number; // Training accuracy (optional)
}

export interface TrainingResult {
  success: boolean;
  weights?: ModelWeights;
  accuracy?: number;
  error?: string;
}

/**
 * Train a logistic regression model from swipe history
 *
 * Model architecture:
 * - Input: 18 features (normalized)
 * - Dense layer: 18 → 1 with sigmoid activation
 * - Loss: Binary crossentropy
 * - Optimizer: Adam with learning rate 0.01
 *
 * @param listings All NYC listings
 * @param swipeHistory User's swipe history (min 10 recommended)
 * @param userLocation Optional user location for distance feature
 * @returns Training result with weights or error
 */
export async function trainModel(
  listings: NYCApartmentListing[],
  swipeHistory: Array<{ listingId: string; liked: boolean }>,
  userLocation?: { latitude: number; longitude: number }
): Promise<TrainingResult> {
  try {
    // Validate input
    if (swipeHistory.length < 5) {
      return {
        success: false,
        error: 'Insufficient training data. Need at least 5 swipes.',
      };
    }

    // Check for class imbalance (need both likes and dislikes)
    const likes = swipeHistory.filter(s => s.liked).length;
    const dislikes = swipeHistory.length - likes;

    if (likes === 0 || dislikes === 0) {
      return {
        success: false,
        error: 'Need examples of both liked and disliked apartments.',
      };
    }

    console.log('[ML] Training with', swipeHistory.length, 'examples:', likes, 'likes,', dislikes, 'dislikes');

    // Calculate feature statistics for normalization
    const stats = calculateFeatureStats(listings);

    // Prepare training data
    const { X, y } = prepareTrainingData(listings, swipeHistory, stats, userLocation);

    if (X.length === 0) {
      return {
        success: false,
        error: 'No valid training examples found.',
      };
    }

    // Convert to tensors
    const xTensor = tf.tensor2d(X);
    const yTensor = tf.tensor2d(y, [y.length, 1]);

    // Build model (simple logistic regression)
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [18], // 18 features
          units: 1, // Binary classification
          activation: 'sigmoid',
          kernelInitializer: 'glorotNormal', // Xavier initialization
        }),
      ],
    });

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.01), // Learning rate 0.01
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Train model
    console.log('[ML] Starting training...');
    const history = await model.fit(xTensor, yTensor, {
      epochs: 100,
      batchSize: Math.min(32, X.length), // Adaptive batch size
      validationSplit: X.length >= 20 ? 0.2 : 0, // Only validate if enough data
      verbose: 0, // Silent training
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`[ML] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc?.toFixed(4)}`);
          }
        },
      },
    });

    // Extract final accuracy
    const finalAccuracy = history.history.acc?.[history.history.acc.length - 1] as number || 0;
    console.log('[ML] Training complete. Final accuracy:', finalAccuracy.toFixed(4));

    // Extract weights and biases
    const weights = model.getWeights();
    const kernelWeights = await weights[0].array() as number[][];
    const biasWeights = await weights[1].array() as number[];

    // Clean up tensors
    xTensor.dispose();
    yTensor.dispose();
    model.dispose();

    return {
      success: true,
      weights: {
        weights: kernelWeights,
        biases: biasWeights,
        featureStats: stats,
        trainedAt: new Date().toISOString(),
        trainingSize: X.length,
        accuracy: finalAccuracy,
      },
      accuracy: finalAccuracy,
    };
  } catch (error) {
    console.error('[ML] Training error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown training error',
    };
  }
}

/**
 * Predict swipe likelihood for a listing using trained model
 *
 * @param listing Listing to predict
 * @param modelWeights Trained model weights
 * @param userLocation Optional user location
 * @returns Probability of right swipe (0-1)
 */
export function predictSwipeLikelihood(
  listing: NYCApartmentListing,
  modelWeights: ModelWeights,
  userLocation?: { latitude: number; longitude: number }
): number {
  try {
    // Extract features
    const { features } = extractFeatures(listing, modelWeights.featureStats, userLocation);

    // Manual forward pass (no need for TF.js inference)
    // y = sigmoid(X @ W + b)
    let logit = modelWeights.biases[0]; // Start with bias

    for (let i = 0; i < features.length; i++) {
      logit += features[i] * modelWeights.weights[i][0];
    }

    // Apply sigmoid
    const probability = 1 / (1 + Math.exp(-logit));

    return probability;
  } catch (error) {
    console.error('[ML] Prediction error:', error);
    return 0.5; // Return neutral probability on error
  }
}

/**
 * Batch predict for multiple listings (more efficient)
 */
export function predictSwipeLikelihoodBatch(
  listings: NYCApartmentListing[],
  modelWeights: ModelWeights,
  userLocation?: { latitude: number; longitude: number }
): number[] {
  return listings.map(listing =>
    predictSwipeLikelihood(listing, modelWeights, userLocation)
  );
}

/**
 * Check if model weights are valid and not too old
 */
export function isModelValid(modelWeights: ModelWeights | null | undefined): boolean {
  if (!modelWeights) return false;
  if (!modelWeights.weights || !modelWeights.biases) return false;
  if (!modelWeights.trainedAt) return false;

  // Check if model is too old (> 7 days)
  const trainedDate = new Date(modelWeights.trainedAt);
  const now = new Date();
  const daysSinceTraining = (now.getTime() - trainedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceTraining > 7) {
    console.log('[ML] Model is stale (', daysSinceTraining.toFixed(1), 'days old)');
    return false;
  }

  return true;
}

/**
 * Derive suggested scoring weights from ML model's learned feature importances
 *
 * Feature mapping to scoring categories:
 * - Distance (weight index 17): Distance score
 * - Amenities (indices 6-16): 11 amenity-related features
 * - Property Features (indices 3-5): Sqft, building age, renovation
 * - Quality (indices 0-2): Price, bedrooms, bathrooms (for photos/description)
 * - Rating: Inferred from overall model confidence
 *
 * @param modelWeights Trained model weights
 * @returns Suggested scoring weights that sum to 100
 */
export function suggestScoringWeights(modelWeights: ModelWeights): {
  distance: number;
  amenities: number;
  propertyFeatures: number;
  quality: number;
  rating: number;
  topPriority: 'distance' | 'amenities' | 'propertyFeatures' | 'quality' | 'rating';
  confidence: number;
} {
  // Extract absolute feature importances
  const weights = modelWeights.weights.map(w => Math.abs(w[0]));

  // Map features to categories (based on ml-features.ts order)
  // Use AVERAGE importance within each category to avoid bias from feature count
  const distanceImportance = weights[17] || 0; // Distance feature (1 feature)
  const amenityWeights = weights.slice(6, 17); // 11 amenity features
  const amenitiesImportance = amenityWeights.reduce((sum, w) => sum + w, 0) / amenityWeights.length; // Average of 11 features
  const qualityWeights = weights.slice(0, 3); // 3 quality features (price, bedrooms, bathrooms)
  const qualityImportance = qualityWeights.reduce((sum, w) => sum + w, 0) / qualityWeights.length; // Average of 3 features
  const propertyWeights = weights.slice(3, 6); // 3 property features (sqft, building age, renovation age)
  const propertyFeaturesImportance = propertyWeights.reduce((sum, w) => sum + w, 0) / propertyWeights.length; // Average of 3 features

  // Rating importance is harder to extract since it's not a direct feature
  // Use a baseline that can be adjusted
  const ratingImportance = Math.max(...weights) * 0.3; // 30% of max feature importance

  // Calculate total importance
  const totalImportance = distanceImportance + amenitiesImportance + propertyFeaturesImportance + qualityImportance + ratingImportance;

  // Normalize to percentages (0-100)
  const rawWeights = {
    distance: (distanceImportance / totalImportance) * 100,
    amenities: (amenitiesImportance / totalImportance) * 100,
    propertyFeatures: (propertyFeaturesImportance / totalImportance) * 100,
    quality: (qualityImportance / totalImportance) * 100,
    rating: (ratingImportance / totalImportance) * 100,
  };

  // Round to nearest 5% and ensure sum is 100
  let distance = Math.round(rawWeights.distance / 5) * 5;
  let amenities = Math.round(rawWeights.amenities / 5) * 5;
  let propertyFeatures = Math.round(rawWeights.propertyFeatures / 5) * 5;
  let quality = Math.round(rawWeights.quality / 5) * 5;
  let rating = Math.round(rawWeights.rating / 5) * 5;

  // Adjust to ensure sum is exactly 100
  const sum = distance + amenities + propertyFeatures + quality + rating;
  const diff = 100 - sum;

  // Add difference to the largest category
  const categories = [
    { name: 'distance' as const, value: distance },
    { name: 'amenities' as const, value: amenities },
    { name: 'propertyFeatures' as const, value: propertyFeatures },
    { name: 'quality' as const, value: quality },
    { name: 'rating' as const, value: rating },
  ];
  const largest = categories.reduce((max, cat) => cat.value > max.value ? cat : max);

  if (largest.name === 'distance') distance += diff;
  else if (largest.name === 'amenities') amenities += diff;
  else if (largest.name === 'propertyFeatures') propertyFeatures += diff;
  else if (largest.name === 'quality') quality += diff;
  else rating += diff;

  // Determine top priority (highest weight)
  const finalWeights = { distance, amenities, propertyFeatures, quality, rating };

  // Find the maximum weight value
  const maxWeight = Math.max(distance, amenities, propertyFeatures, quality, rating);

  // Find all priorities with the max weight (handle ties)
  const topPriorities = Object.entries(finalWeights)
    .filter(([, value]) => value === maxWeight)
    .map(([key]) => key as 'distance' | 'amenities' | 'propertyFeatures' | 'quality' | 'rating');

  // Use the first one for single top priority, or prefer amenities in ties (most specific)
  const topPriority = topPriorities.length === 1
    ? topPriorities[0]
    : topPriorities.includes('amenities')
      ? 'amenities'
      : topPriorities[0];

  // Calculate confidence based on how much the model has learned
  // Higher training size and accuracy = higher confidence
  // Reduce confidence if there are ties (less clear preference)
  const tieReduction = topPriorities.length > 1 ? 0.7 : 1.0;
  const confidence = Math.min(
    (modelWeights.trainingSize / 50) * (modelWeights.accuracy || 0.5) * tieReduction,
    1
  );

  console.log('[ML] Suggested weights:', finalWeights, 'Top priority:', topPriority, topPriorities.length > 1 ? `(tied with ${topPriorities.join(', ')})` : '', 'Confidence:', confidence.toFixed(2));

  return {
    distance,
    amenities,
    propertyFeatures,
    quality,
    rating,
    topPriority,
    confidence,
  };
}
