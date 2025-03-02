from torchvision import transforms
from torch.utils.data import DataLoader
import torch
import torch.nn as nn
from torchvision import models

from trash_dataset import BinaryClassificationDataset
import os
from datetime import datetime
import json
import time

# Create a logging directory if it doesn't exist
log_dir = "./logs"
os.makedirs(log_dir, exist_ok=True)

# Generate a unique log file name with timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_file = os.path.join(log_dir, f"training_log_{timestamp}.json")


# Initialize log dictionary
log_data = {
    "training_info": {
        "started_at": timestamp,
        "model": "ResNet50",
        "batch_size": 32,
        "epochs": 100,
        "optimizer": "Adam",
        "learning_rate": 0.001,
    },
    "epochs": [],
}


# Function to save log data
def save_log():
    with open(log_file, "w") as f:
        json.dump(log_data, f, indent=4)
    print(f"Log saved to {log_file}")


# Define transformations
transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        # Dont use random crop as it might remove important features, e.g. if the liquid section is cropped out,
        # It might think that the bottle is recyclable as it is empty
        # transforms.RandomCrop(224),
        transforms.RandomAffine(0, translate=(0.1, 0.1)),
        # Based on imagenet statistics
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)


# Create datasets
train_dataset = BinaryClassificationDataset(
    root_dir="./data", split="train", transform=transform
)

test_dataset = BinaryClassificationDataset(
    root_dir="./data", split="test", transform=transform
)

# Create dataloaders
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=4)

# Load pretrained ResNet50 from torchvision
resnet50 = models.resnet50(pretrained=True)

# Replace the final fully connected layer
num_ftrs = resnet50.fc.in_features  # This will automatically get the correct dimension
resnet50.fc = nn.Linear(num_ftrs, 1)  # Binary classification

# Print the classifier to see its structure
# print("Original classifier:", resnet50.classifier)
resnet50.classifier = nn.Linear(2048, 1)  # For binary classification
print("New classifier:", resnet50.classifier)

# Loss function and optimizer
criterion = nn.BCEWithLogitsLoss()
optimizer = torch.optim.Adam(resnet50.parameters(), lr=0.001)

# Check if CUDA is available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")
resnet50.to(device)


# Training loop
start_time = time.time()
num_epochs = 100

# Track the best model
best_accuracy = 0.0
best_model_path = None

for epoch in range(num_epochs):
    resnet50.train()
    running_loss = 0.0
    epoch_loss = 0.0
    batch_losses = []

    for i, (inputs, labels) in enumerate(train_loader):
        inputs, labels = inputs.to(device), labels.to(device)

        # Zero the parameter gradients
        optimizer.zero_grad()

        # Forward pass
        outputs = resnet50(inputs)
        loss = criterion(outputs.squeeze(), labels.float())

        # Backward pass and optimize
        loss.backward()
        optimizer.step()

        # Log the batch loss
        batch_loss = loss.item()
        running_loss += batch_loss
        epoch_loss += batch_loss
        batch_losses.append(batch_loss)

        # Print statistics every 10 mini-batches
        if i % 10 == 9:
            avg_loss = running_loss / 10
            print(f"Epoch {epoch+1}/{num_epochs}, Batch {i+1}, Loss: {avg_loss:.4f}")
            running_loss = 0.0

    # Calculate average epoch loss
    avg_epoch_loss = epoch_loss / len(train_loader)

    # Evaluation at the end of each epoch
    resnet50.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = resnet50(inputs)
            predicted = (outputs.squeeze() > 0).float()
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    # Calculate accuracy
    accuracy = 100 * correct / total

    # Print epoch results
    print(
        f"Epoch [{epoch+1}/{num_epochs}] completed, Loss: {avg_epoch_loss:.4f}, Accuracy: {accuracy:.2f}%"
    )

    # Save the best model if this epoch has the highest accuracy so far
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model_path = f"resnet50v30_best_model_{timestamp}_epoch{epoch+1}.pth"
        torch.save(resnet50.state_dict(), best_model_path)
        print(f"New best model saved with accuracy: {best_accuracy:.2f}%")

    # Log the epoch data
    epoch_data = {
        "epoch": epoch + 1,
        "loss": avg_epoch_loss,
        "accuracy": accuracy,
        "batch_losses": batch_losses,
    }
    log_data["epochs"].append(epoch_data)

    # Save log after each epoch
    save_log()

    # Back to training mode for next epoch
    resnet50.train()


# Evaluation
resnet50.eval()
with torch.no_grad():
    correct = 0
    total = 0
    for inputs, labels in test_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = resnet50(inputs)
        predicted = (outputs.squeeze() > 0).float()
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

    accuracy = 100 * correct / total
    print(f"Test Accuracy: {accuracy:.2f}%")
    final_accuracy = 100 * correct / total
    print(f"Final Test Accuracy: {final_accuracy:.2f}%")
    log_data["training_info"]["final_accuracy"] = final_accuracy


# Calculate total training time
training_time = time.time() - start_time
log_data["training_info"]["total_time_seconds"] = training_time
log_data["training_info"]["completed_at"] = datetime.now().strftime("%Y%m%d_%H%M%S")
print(f"Total training time: {training_time:.2f} seconds")

# Save the final log
save_log()

# Save the final model (last epoch)
final_model_path = f"resnet50v100_final_epoch{num_epochs}_{timestamp}.pth"
torch.save(resnet50.state_dict(), final_model_path)
log_data["training_info"]["final_model_path"] = final_model_path
print(f"Final model saved successfully to {final_model_path}!")

# Print summary of best model vs. final model
print(f"Best model: {best_model_path} with accuracy: {best_accuracy:.2f}%")
print(f"Final model: {final_model_path} with accuracy: {final_accuracy:.2f}%")

# Record both models in the log
log_data["training_info"]["model_comparison"] = {
    "best_model": {
        "path": best_model_path,
        "accuracy": best_accuracy,
        "epoch": next(
            e["epoch"] for e in log_data["epochs"] if e.get("is_best_model", False)
        ),
    },
    "final_model": {
        "path": final_model_path,
        "accuracy": final_accuracy,
        "epoch": num_epochs,
    },
}

# Save the final log one more time with the model paths
save_log()
