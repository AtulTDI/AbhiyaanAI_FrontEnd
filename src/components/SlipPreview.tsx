import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import ViewShot from "react-native-view-shot";

type Props = {
  candidate: {
    candidateName: string;
    candidatePhotoPath?: string;
    partyName: string;
    symbolName?: string;
    symbolImagePath?: string;
  };
  voter: {
    voterName: string;
    prabagNumber: number | string;
    rank: number | string;
    epicId: string;
    assemblyNumber: string;
    pollingBooth: string;
    pollingBoothAddress: string;
    electionDate: string;
  };
};

const SlipPreview = forwardRef<ViewShot, Props>(({ candidate, voter }, ref) => {
  const date = voter.electionDate?.split(" ")[0];
  const time = voter.electionDate?.replace(date, "").trim();

  return (
    <ViewShot
      ref={ref}
      options={{
        format: "png",
        quality: 1,
        result: "base64",
        width: 384,
      }}
    >
      <View style={styles.slip} collapsable={false}>
        {/* Candidate Section */}
        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            उमेदवार:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {candidate.candidateName}
          </Text>
        </Text>

        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            पार्टी:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {candidate.partyName}
          </Text>
        </Text>

        {candidate.symbolImagePath && (
          <View style={styles.symbolRow}>
            <Image
              source={{ uri: candidate.symbolImagePath }}
              style={styles.symbol}
            />
          </View>
        )}

        <View style={styles.divider} />

        {/* Voter Section */}
        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            नाव:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {voter.voterName}
          </Text>
        </Text>

        <View style={styles.inlineRow}>
          <Text allowFontScaling={false} style={styles.label}>
            प्रभाग:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {voter.prabagNumber}
          </Text>
          <Text allowFontScaling={false} style={styles.label}>
            {" "}
            अ.क्र:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {voter.rank}
          </Text>
        </View>

        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            मतदान कार्ड:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {voter.epicId}
          </Text>
        </Text>

        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            विधानसभा क्र:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {voter.assemblyNumber}
          </Text>
        </Text>

        <View style={styles.divider} />

        {/* Booth Info */}
        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            मतदान केंद्र:
          </Text>
        </Text>
        <Text allowFontScaling={false} style={styles.wrap}>
          {voter.pollingBooth}
        </Text>

        <Text allowFontScaling={false} style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            पत्ता:
          </Text>
        </Text>
        <Text allowFontScaling={false} style={styles.wrap}>
          {voter.pollingBoothAddress}
        </Text>

        <View style={styles.divider} />

        {/* Date & Time */}
        <Text allowFontScaling={false} style={styles.inlineRow}>
          <Text allowFontScaling={false} style={styles.label}>
            दिनांक:{" "}
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            {date}
          </Text>
        </Text>

        {time && (
          <Text allowFontScaling={false} style={styles.inlineRow}>
            <Text allowFontScaling={false} style={styles.label}>
              वेळ:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {time}
            </Text>
          </Text>
        )}

        <View style={{ height: 36 }} />
      </View>
    </ViewShot>
  );
});

export default SlipPreview;

const styles = StyleSheet.create({
  slip: {
    width: 384,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  row: {
    fontSize: 24,
    lineHeight: 28,
    color: "#000",
    includeFontPadding: false,
    backgroundColor: "#FFF",
    textAlignVertical: "center",
  },
  wrap: {
    fontSize: 24,
    lineHeight: 28,
    color: "#000",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  label: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
    includeFontPadding: false,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
    includeFontPadding: false,
  },
  divider: {
    height: 10,
    backgroundColor: "#000",
    marginVertical: 10,
  },
  symbolRow: {
    alignItems: "center",
    marginVertical: 6,
  },
  symbol: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
});