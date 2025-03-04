

Teamp OpenDeep, submission for NTU dlweek 2025

🎉 Top 12 Teams, Best Freshman Team 🎉

# Jiggle Bin: AI-Powered Household Recycling Bin

AI-powered simple smart bin for efficient household recycling and waste sorting

## Problem

A major problem to recycling is the contamination of recyclables in household waste. In Singapore, 40% of items in blue recycling bins in housing estates cannot be recycled due to contamination. This occurs because consumers knowingly or unknowingly throw contaminated recyclables into blue bins, mixing them with clean recyclables and rendering them unrecyclable. As such, we target the root of the problem which is the hassle of separating trash into recyclables and contaminants.

## Solution - AI + Physical

### Physical Component

- Dual compartment system to separate wet contaminated waste from recyclable waste
- Tilting disk mechanism to create splashes for liquid detection
- Visual sensor for data input
- Motion sensor triggering light for clear image capture
- Grated area above non-recyclable compartment for disposing remnant liquid

### AI Component

- CNN-Powered model for waste classification
- Utilizes ResNet-50 architecture fine-tuned on custom dataset
- Classifies items as recyclable or contaminated/non-recyclable

## AI Process

### Data Processing and Augmentation

1. Dataset sourced from Kaggle, including images of clean recyclables and non-recyclables
2. Image augmentation techniques applied:
   - Horizontal and vertical flips
   - Rotation
   - Resizing
   - Affine transformations
3. Synthetic data creation: PNGs of liquid splash overlaid on recyclable items to simulate contamination

### Model Performance

- Achieved 86.92% accuracy on the test set
- Successfully differentiates between clean and contaminated versions of the same item (e.g., dry vs. wet plastic bag)
- Correctly identifies recyclables in various positions and lighting conditions

## Feasibility

- The solution can be scaled to neighborhood bins
- Requires only the addition of a tilting disk and visual sensor to existing bin designs
- Can be further specialized for different types of recycling bins

## Limitations

1. Halved storage capacity: The dual compartment system reduces the overall storage capacity of the bin
2. Limited detection: Some liquids may not be detected due to their viscosity, and the vibration of the tilting disk may not always generate sufficient patterns for liquid detection
3. Current model focuses on general waste classification and may require further specialization for specific recycling categories

More info can be found on the slide deck!
