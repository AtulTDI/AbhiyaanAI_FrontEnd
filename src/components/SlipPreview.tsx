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
        quality: 1.0,
        result: "base64",
        width: 384,
        height: 800
      }}
    >
      <View style={styles.slip} collapsable={false}>
        {/* Candidate Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              उमेदवार:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {candidate.candidateName}
            </Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              पार्टी:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {candidate.partyName}
            </Text>
          </View>

          {candidate.symbolImagePath && (
            <View style={styles.symbolRow}>
              <Image
                source={{ uri: candidate.symbolImagePath }}
                style={styles.symbol}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Voter Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              नाव:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {voter.voterName}
            </Text>
          </View>

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

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              मतदान कार्ड:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {voter.epicId}
            </Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              विधानसभा क्र:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {voter.assemblyNumber}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Booth Info */}
        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.label}>
            मतदान केंद्र:
          </Text>
          <Text style={styles.wrapText} allowFontScaling={false}>
            {voter.pollingBooth}
          </Text>

          <View style={styles.spacer} />

          <Text allowFontScaling={false} style={styles.label}>
            पत्ता:
          </Text>
          <Text style={styles.wrapText} allowFontScaling={false}>
            {voter.pollingBoothAddress}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>
              दिनांक:{" "}
            </Text>
            <Text allowFontScaling={false} style={styles.value}>
              {date}
            </Text>
          </View>

          {time && time !== "Invalid Date" && (
            <View style={styles.row}>
              <Text allowFontScaling={false} style={styles.label}>
                वेळ:{" "}
              </Text>
              <Text allowFontScaling={false} style={styles.value}>
                {time}
              </Text>
            </View>
          )}
        </View>

        {/* Footer spacing */}
        <View style={styles.footerSpacer} />
      </View>
    </ViewShot>
  );
});

export default SlipPreview;

const styles = StyleSheet.create({
  slip: {
    width: 384,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  section: {
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    minHeight: 28,
  },
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginVertical: 4,
    minHeight: 28,
  },
  label: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: "center",
    color: "#000000",
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 22,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: "center",
    color: "#000000",
    flex: 1,
    flexWrap: "wrap",
    letterSpacing: 0.2,
  },
  wrapText: {
    fontSize: 22,
    lineHeight: 24,
    includeFontPadding: false,
    color: "#000000",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  divider: {
    height: 10,
    backgroundColor: "#000000",
    marginVertical: 8,
    width: "100%",
  },
  symbolRow: {
    alignItems: "center",
    marginVertical: 8,
    justifyContent: "center",
  },
  symbol: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  spacer: {
    height: 6,
  },
  footerSpacer: {
    height: 16,
  },
});