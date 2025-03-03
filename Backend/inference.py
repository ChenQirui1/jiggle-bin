import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import matplotlib.pyplot as plt
import argparse
import os
import glob


def load_model(model_path):
    """Load the pretrained ResNet50 model with custom classification head."""
    try:
        # Create our custom model
        # Create the model architecture
        model = models.resnet50(weights=None)

        # Replace final layer for binary classification
        num_features = model.fc.in_features
        model.fc = torch.nn.Linear(num_features, 1)

        # Load trained weights
        # model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))

        # Load just the state dict without any architecture
        state_dict = torch.load(model_path, map_location=torch.device("cpu"))

        # Check if we have the expected keys
        has_classifier = (
            "classifier.weight" in state_dict and "classifier.bias" in state_dict
        )

        if has_classifier:
            print("Found classifier weights in state dict. Loading them directly.")
            # Create a reduced state dict with just the classifier weights
            classifier_state_dict = {
                "classifier.weight": state_dict["classifier.weight"],
                "classifier.bias": state_dict["classifier.bias"],
            }

            # Load just the classifier weights
            model.load_state_dict(classifier_state_dict, strict=False)

            model.eval()
            return model
        else:
            raise ValueError("No classifier weights found in state dict")

    except Exception as e:
        raise Exception(f"Failed to load model: {e}")


def preprocess_image(image_path):
    """Load and preprocess an image for inference."""
    # Define the same transformations used during training
    transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    # Load the image
    image = Image.open(image_path)

    # Handle palette images with transparency
    if image.mode == "P" and "transparency" in image.info:
        image = image.convert("RGBA")

    # Convert any RGBA images to RGB
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])  # Use alpha channel as mask
        image = background
    else:
        image = image.convert("RGB")

    # Apply transformations
    image_tensor = transform(image).unsqueeze(0)  # Add batch dimension

    return image_tensor, image


def predict(model, image_tensor, device="cpu"):
    """Run inference on the image tensor."""
    # Move model and image tensor to specified device
    model = model.to(device)
    image_tensor = image_tensor.to(device)

    # Run inference
    with torch.no_grad():
        outputs = model(image_tensor)
        # Apply sigmoid to convert logits to probability
        probabilities = torch.sigmoid(outputs)
        # Get class prediction
        predictions = (probabilities >= 0.5).float()

    return predictions.item(), probabilities.item()


def visualize_prediction(image, prediction, probability, output_path=None):
    """Visualize the prediction result."""
    plt.figure(figsize=(6, 6))
    plt.imshow(image)

    # Add prediction information as title
    class_name = "1" if prediction == 1 else "0"
    plt.title(f"Predicted: Class {class_name} ({probability:.2f})")

    plt.axis("off")

    # Save the visualization if output path is provided
    if output_path:
        plt.savefig(output_path)
        print(f"Visualization saved to {output_path}")

    plt.show()

def inference(image_path, model_path, gpu = None, output = "results"):
    device = torch.device("cuda" if torch.cuda.is_available() and gpu else "cpu")
    print(f"Using device: {device}")
    
    # Load model
    try:
        model = load_model(model_path)
        print(f"Model loaded successfully from {model_path}")
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    
    
        # Get image paths
    image_paths = []
    if image_path:
        if os.path.exists(image_path):
            image_paths.append(image_path)
        else:
            print(f"Image not found: {image_path}")
            return
    else:
        print("Please provide either image_path argument")
        return
    
    # Create output directory if it doesn't exist
    if output:
        os.makedirs(output, exist_ok=True)
        
        # Process each image
    for i, image_path in enumerate(image_paths):
        try:
            print(f"Processing image: {image_path}")

            # Preprocess image
            image_tensor, original_image = preprocess_image(image_path)

            # Run inference
            prediction, probability = predict(model, image_tensor, device)

            # Display results
            print(
                f"Prediction: Class {int(prediction)} with confidence {probability:.4f}"
            )

            # Save visualization
            if output:
                filename = os.path.basename(image_path)
                output_path = os.path.join(output, f"result_{filename}")
                visualize_prediction(
                    original_image, prediction, probability, output_path
                )
            else:
                visualize_prediction(original_image, prediction, probability)

            print("-" * 50)
        except Exception as e:
            print(f"Error processing {image_path}: {e}")

    print("Inference completed!")
    return {"prediction":int(prediction),"confidence":probability}
    

def main():
    parser = argparse.ArgumentParser(
        description="ResNet50 Binary Classification Inference"
    )
    parser.add_argument("model_path", help="Path to the trained model file (.pth)")
    parser.add_argument("--image", help="Path to a single image for inference")
    parser.add_argument(
        "--dir", help="Path to directory containing images for inference"
    )
    parser.add_argument(
        "--output", help="Directory to save visualization results", default="results"
    )
    parser.add_argument(
        "--gpu", action="store_true", help="Use GPU for inference if available"
    )

    args = parser.parse_args()

    # Set device for inference
    device = torch.device("cuda" if torch.cuda.is_available() and args.gpu else "cpu")
    print(f"Using device: {device}")

    # Load model
    try:
        model = load_model(args.model_path)
        print(f"Model loaded successfully from {args.model_path}")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # Get image paths
    image_paths = []
    if args.image:
        if os.path.exists(args.image):
            image_paths.append(args.image)
        else:
            print(f"Image not found: {args.image}")
            return
    elif args.dir:
        if os.path.exists(args.dir):
            image_paths.extend(glob.glob(os.path.join(args.dir, "*.jpg")))
            image_paths.extend(glob.glob(os.path.join(args.dir, "*.jpeg")))
            image_paths.extend(glob.glob(os.path.join(args.dir, "*.png")))
            if not image_paths:
                print(f"No images found in directory: {args.dir}")
                return
        else:
            print(f"Directory not found: {args.dir}")
            return
    else:
        print("Please provide either --image or --dir argument")
        return

    # Create output directory if it doesn't exist
    if args.output:
        os.makedirs(args.output, exist_ok=True)

    # Process each image
    for i, image_path in enumerate(image_paths):
        try:
            print(f"Processing image: {image_path}")

            # Preprocess image
            image_tensor, original_image = preprocess_image(image_path)

            # Run inference
            prediction, probability = predict(model, image_tensor, device)

            # Display results
            print(
                f"Prediction: Class {int(prediction)} with confidence {probability:.4f}"
            )

            # Save visualization
            if args.output:
                filename = os.path.basename(image_path)
                output_path = os.path.join(args.output, f"result_{filename}")
                visualize_prediction(
                    original_image, prediction, probability, output_path
                )
            else:
                visualize_prediction(original_image, prediction, probability)

            print("-" * 50)
        except Exception as e:
            print(f"Error processing {image_path}: {e}")

    print("Inference completed!")

def import_test():
    return True

if __name__ == "__main__":
    main()
