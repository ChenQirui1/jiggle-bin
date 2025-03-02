export const fileDownload = async (frames) => {
  console.log(`Captured ${frames.length} frames`);

  try {
    // Check if FileSystem Access API is available (modern browsers)
    if ("showDirectoryPicker" in window) {
      // Get permission to access the assets directory
      let directoryHandle;

      try {
        // Try to get the assets directory if previously permitted
        const root = await navigator.storage.getDirectory();
        directoryHandle = await root.getDirectoryHandle("assets", {
          create: true,
        });
      } catch (error) {
        // If not previously permitted, ask user to select directory
        directoryHandle = await window.showDirectoryPicker({
          id: "assets",
          startIn: "documents",
          mode: "readwrite",
        });
      }

      // Save each frame to the assets directory
      for (let i = 0; i < frames.length; i++) {
        const frameDataUrl = frames[i];

        // Convert data URL to blob
        const response = await fetch(frameDataUrl);
        const blob = await response.blob();

        // Create a unique filename
        const timestamp = new Date().getTime();
        const fileName = `frame_${timestamp}_${i}.jpg`;

        // Create and write to the file
        const fileHandle = await directoryHandle.getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log(`Frame ${i + 1} saved to assets/${fileName}`);
      }
    }
    // Fallback for browsers without FileSystem Access API
    else {
      // Use the download method as a fallback
      for (let i = 0; i < frames.length; i++) {
        const frameDataUrl = frames[i];

        // Convert data URL to blob
        const response = await fetch(frameDataUrl);
        const blob = await response.blob();

        // Create a unique filename
        const timestamp = new Date().getTime();
        const fileName = `frame_${timestamp}_${i}.jpg`;

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`Frame ${i + 1} downloaded as ${fileName}`);
      }

      alert(
        "Your browser doesn't support direct file system access. Files have been downloaded instead."
      );
    }
  } catch (error) {
    console.error("Error saving frames to assets directory:", error);
    alert(
      "Failed to save frames to assets directory. See console for details."
    );
  }
};
