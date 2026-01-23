import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import ViewShot from "react-native-view-shot";

type Props = {
  slipText: string;
};

const SlipPreview = forwardRef<ViewShot, Props>(({ slipText }, ref) => {
  return (
    <ViewShot
      ref={ref}
      options={{
        format: "png",
        quality: 1,
        result: "base64",
      }}
    >
      <View style={styles.container}>
        <Text style={styles.text}>{slipText}</Text>
      </View>
    </ViewShot>
  );
});

export default SlipPreview;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: 384,
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 18,
    lineHeight: 26,
    color: "#000000",
  },
});