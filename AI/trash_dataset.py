import os
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image


class BinaryClassificationDataset(Dataset):
    def __init__(self, root_dir, split="train", transform=None):
        """
        Binary classification dataset that expects a directory structure:
        root_dir/
            train/
                0/
                    img1.jpg
                    img2.jpg
                    ...
                1/
                    img1.jpg
                    img2.jpg
                    ...
            test/
                0/
                    img1.jpg
                    img2.jpg
                    ...
                1/
                    img1.jpg
                    img2.jpg
                    ...

        Args:
            root_dir (str): Root directory of the dataset
            split (str): 'train' or 'test'
            transform: Optional transform to be applied to the images
        """
        self.root_dir = root_dir
        self.split = split
        self.transform = transform
        self.class_dirs = ["0", "1"]

        self.image_paths = []
        self.labels = []

        # Build dataset by scanning directory structure
        split_dir = os.path.join(root_dir, split)
        for class_idx, class_name in enumerate(self.class_dirs):
            class_dir = os.path.join(split_dir, class_name)
            if not os.path.exists(class_dir):
                continue

            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith((".png", ".jpg", ".jpeg")):
                    img_path = os.path.join(class_dir, img_name)
                    self.image_paths.append(img_path)
                    self.labels.append(class_idx)

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        # Load image and convert palette images with transparency to RGBA
        image = Image.open(img_path)
        if image.mode == "P" and "transparency" in image.info:
            image = image.convert("RGBA")

        # Convert any RGBA images to RGB (if you don't need transparency)
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])  # Use alpha channel as mask
            image = background
        else:
            image = image.convert("RGB")

        # Apply transforms if any
        if self.transform:
            image = self.transform(image)

        return image, label


# Example usage:
if __name__ == "__main__":
    # Define transformations
    transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            # based on imagenet statistics
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

    # Print dataset info
    print(f"Training samples: {len(train_dataset)}")
    print(f"Testing samples: {len(test_dataset)}")

    # Example of iterating through dataloader
    for images, labels in train_loader:
        print(f"Batch shape: {images.shape}")
        print(f"Labels shape: {labels.shape}")
        break
