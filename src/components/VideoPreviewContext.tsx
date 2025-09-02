import React, { createContext, useState, useContext, ReactNode } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { ResizeMode, Video as ExpoVideo } from "expo-av";
import { AppTheme } from "../theme";

type ContextType = {
  open: (uri: string) => void;
  close: () => void;
};

const VideoPreviewContext = createContext<ContextType | null>(null);

export const useVideoPreview = () => {
  const ctx = useContext(VideoPreviewContext);
  if (!ctx) throw new Error("useVideoPreview must be used within Provider");
  return ctx;
};

export const VideoPreviewProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const [uri, setUri] = useState<string | null>(null);

  const open = (videoUri: string) => setUri(videoUri);
  const close = () => setUri(null);

  return (
    <VideoPreviewContext.Provider value={{ open, close }}>
      {children}
      <Modal visible={!!uri} animationType="slide" transparent={false}>
        <View style={styles.fullscreenContainer}>
          <View style={styles.videoContainer}>
            {uri && (
              <ExpoVideo
                source={{ uri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                style={styles.video}
              />
            )}
          </View>
          <Button mode="contained" onPress={close} style={styles.closeButton}>
            Close
          </Button>
        </View>
      </Modal>
    </VideoPreviewContext.Provider>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    fullscreenContainer: {
      flex: 1,
      backgroundColor: theme.colors.black,
    },
    videoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    video: {
      width: "100%",
      height: "100%",
    },
    closeButton: {
      margin: 16,
      alignSelf: "center",
    },
  });
