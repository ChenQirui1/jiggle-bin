import json
import matplotlib.pyplot as plt
import os
import argparse
from glob import glob


def find_latest_log():
    """Find the most recent log file in the logs directory."""
    log_files = glob("./logs/training_log_*.json")
    if not log_files:
        raise FileNotFoundError("No log files found in ./logs directory")
    return max(log_files, key=os.path.getctime)


def plot_metrics(log_file=None):
    """Plot training metrics from a log file."""
    if log_file is None:
        log_file = find_latest_log()
        print(f"Using latest log file: {log_file}")

    # Load the log data
    with open(log_file, "r") as f:
        log_data = json.load(f)

    # Extract training info
    training_info = log_data["training_info"]
    model_name = training_info["model"]
    start_time = training_info["started_at"]

    # Extract metrics
    epochs = [epoch_data["epoch"] for epoch_data in log_data["epochs"]]
    losses = [epoch_data["loss"] for epoch_data in log_data["epochs"]]
    accuracies = [epoch_data["accuracy"] for epoch_data in log_data["epochs"]]

    # Find the best model epoch
    best_epoch = None
    best_accuracy = 0

    # Check if we have best_model info in the training_info
    if "best_model" in training_info:
        best_epoch = training_info["best_model"]["epoch"]
        best_accuracy = training_info["best_model"]["accuracy"]
    else:
        # Otherwise, find the best model from epochs data
        for i, epoch_data in enumerate(log_data["epochs"]):
            if epoch_data.get("is_best_model", False) or (
                epoch_data["accuracy"] > best_accuracy
            ):
                best_epoch = epoch_data["epoch"]
                best_accuracy = epoch_data["accuracy"]

    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), sharex=True)
    fig.suptitle(f"{model_name} Training Metrics - {start_time}", fontsize=16)

    # Plot loss
    ax1.plot(epochs, losses, "b-", linewidth=2, marker="o", markersize=4)
    ax1.set_ylabel("Loss", fontsize=14)
    ax1.set_title("Training Loss over Epochs", fontsize=14)
    ax1.grid(True, linestyle="--", alpha=0.7)

    # Plot accuracy
    ax2.plot(epochs, accuracies, "g-", linewidth=2, marker="o", markersize=4)
    ax2.set_xlabel("Epoch", fontsize=14)
    ax2.set_ylabel("Accuracy (%)", fontsize=14)
    ax2.set_title("Validation Accuracy over Epochs", fontsize=14)
    ax2.grid(True, linestyle="--", alpha=0.7)

    # Highlight best model epoch if available
    if best_epoch is not None:
        best_idx = epochs.index(best_epoch)
        ax1.plot(best_epoch, losses[best_idx], "ro", markersize=10, label="Best Model")
        ax2.plot(
            best_epoch, accuracies[best_idx], "ro", markersize=10, label="Best Model"
        )
        ax2.legend(loc="lower right")

        # Add best model info text box
        ax2.text(
            0.02,
            0.85,
            f"Best Model (Epoch {best_epoch}):\nAccuracy: {best_accuracy:.2f}%",
            transform=ax2.transAxes,
            fontsize=12,
            bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="red", alpha=0.8),
        )

    # Add final accuracy information
    if "final_accuracy" in training_info:
        final_acc = training_info["final_accuracy"]
        ax2.text(
            0.02,
            0.95,
            f"Final Model (Epoch {epochs[-1]}):\nAccuracy: {final_acc:.2f}%",
            transform=ax2.transAxes,
            fontsize=12,
            bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="green", alpha=0.8),
        )

    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    # Save the figure
    output_dir = "./plots"
    os.makedirs(output_dir, exist_ok=True)
    plot_filename = os.path.join(output_dir, f"training_metrics_{start_time}.png")
    plt.savefig(plot_filename, dpi=300, bbox_inches="tight")
    print(f"Plot saved to {plot_filename}")

    # Optional: Plot batch losses for specific epochs
    plot_batch_losses(log_data, output_dir, start_time)

    # Show the plot
    plt.show()


def plot_batch_losses(log_data, output_dir, timestamp):
    """Plot batch losses for selected epochs."""
    # Choose epochs to plot (first, last, and middle)
    epochs_data = log_data["epochs"]
    n_epochs = len(epochs_data)

    if n_epochs <= 0:
        return

    # Select epochs to plot (first, last, and middle if available)
    selected_indices = [0, n_epochs - 1]
    if n_epochs > 2:
        selected_indices.insert(1, n_epochs // 2)

    plt.figure(figsize=(12, 6))
    colors = ["b", "g", "r"]

    for i, idx in enumerate(selected_indices):
        epoch_data = epochs_data[idx]
        epoch_num = epoch_data["epoch"]
        batch_losses = epoch_data["batch_losses"]

        # Plot batch losses
        batches = range(1, len(batch_losses) + 1)
        plt.plot(
            batches,
            batch_losses,
            color=colors[i],
            linewidth=2,
            alpha=0.7,
            label=f"Epoch {epoch_num}",
        )

    plt.xlabel("Batch", fontsize=14)
    plt.ylabel("Loss", fontsize=14)
    plt.title("Batch Losses During Training", fontsize=16)
    plt.grid(True, linestyle="--", alpha=0.7)
    plt.legend()

    # Save the figure
    batch_plot_filename = os.path.join(output_dir, f"batch_losses_{timestamp}.png")
    plt.savefig(batch_plot_filename, dpi=300, bbox_inches="tight")
    print(f"Batch losses plot saved to {batch_plot_filename}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Plot training metrics from log file")
    parser.add_argument(
        "--log-file",
        type=str,
        help="Path to the log file (if not specified, uses latest)",
        default=None,
    )
    args = parser.parse_args()

    plot_metrics(args.log_file)
