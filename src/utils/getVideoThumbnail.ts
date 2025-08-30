import { Platform } from "react-native";
import { Thumbnail } from "../types";
import { getFileNameWithoutExtension } from "./common";

export const getVideoThumbnail = async (
  videoUri: string,
  fileName: string
): Promise<Thumbnail | null> => {
  if (Platform.OS === "web") {
    return getWebThumbnail(videoUri, fileName);
  } else {
    return getMobileThumbnail(videoUri, fileName);
  }
};

const getWebThumbnail = async (
  videoUri: string,
  fileName: string
): Promise<Thumbnail | null> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.src = videoUri;
      video.crossOrigin = "anonymous";
      video.currentTime = 1;
      video.muted = true;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context null");

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) return reject("Failed to create blob");

          const file = new File([blob], "thumbnail.jpg", { type: blob.type });

          resolve({
            uri: URL.createObjectURL(blob),
            mimeType: blob.type,
            name: `${getFileNameWithoutExtension(fileName)}_thumbnail.png`,
            file,
          });
        }, "image/jpeg");
      };

      video.onerror = () => reject("Video load error");
    } catch (error) {
      reject(error);
    }
  });
};

const getMobileThumbnail = async (
  videoUri: string,
  fileName: string
): Promise<Thumbnail | null> => {
  try {
    const { createThumbnail } = await import("react-native-create-thumbnail");

    const response = await createThumbnail({
      url: videoUri,
      timeStamp: 1000,
    });

    const baseName = getFileNameWithoutExtension(fileName);

    return {
      uri: response.path.startsWith("file://")
        ? response.path
        : `file://${response.path}`,
      mimeType: "image/jpeg",
      name: `${baseName}_thumbnail.jpg`,
    };
  } catch (error) {
    console.error("❌ Thumbnail generation error:", error);
    return null;
  }
};