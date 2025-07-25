import { Thumbnail } from "../types";
import { getFileNameWithoutExtension } from "./common";
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

export const getMobileThumbnail = async (
  videoUri: string,
  fileName: string
): Promise<Thumbnail | null> => {
  try {
    const outputPath = `${RNFS.CachesDirectoryPath}/${getFileNameWithoutExtension(fileName)}_thumbnail.jpg`;
    const command = `-i "${videoUri}" -ss 00:00:01.000 -vframes 1 "${outputPath}"`;

    await FFmpegKit.execute(command);

    return {
      uri: `file://${outputPath}`,
      mimeType: "image/png",
      name: `${getFileNameWithoutExtension(fileName)}_thumbnail.png`,
    };
  } catch (error) {
    console.error("❌ FFmpeg thumbnail error", error);
    return null;
  }
};