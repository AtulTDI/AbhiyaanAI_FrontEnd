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
        width: 384 * 2,
      }}
    >
      <View style={styles.slip}>
        {/* {candidate.candidatePhotoPath ? (
          <Image
            source={{ uri: candidate.candidatePhotoPath }}
            style={styles.headerImage}
          />
        ) : null} */}

        {/* Candidate Section */}
        <Text style={styles.row}>
          <Text style={styles.label}>उमेदवार:</Text> {candidate.candidateName}
        </Text>

        <Text style={styles.row}>
          <Text style={styles.label}>पार्टी:</Text> {candidate.partyName}
        </Text>

        <View style={styles.symbolRow}>
          <Text style={styles.label}>निशाणी:</Text>
          {candidate.symbolImagePath ? (
            <Image
              source={{ uri: candidate.symbolImagePath }}
              style={styles.symbol}
            />
          ) : (
            <Text style={styles.row}> {candidate.symbolName ?? "-"} </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Voter Section */}
        <Text style={styles.row}>
          <Text style={styles.label}>नाव:</Text> {voter.voterName}
        </Text>

        <Text style={styles.inline}>
          <Text style={styles.label}>प्रभाग:</Text> {voter.prabagNumber}
          {"  "}
          <Text style={styles.label}>अ.क्र:</Text> {voter.rank}
        </Text>

        <Text style={styles.row}>
          <Text style={styles.label}>मतदान कार्ड:</Text> {voter.epicId}
        </Text>

        <Text style={styles.row}>
          <Text style={styles.label}>विधानसभा क्र:</Text> {voter.assemblyNumber}
        </Text>

        <View style={styles.divider} />

        {/* Booth Info */}
        <Text style={styles.row}>
          <Text style={styles.label}>मतदान केंद्र:</Text>
        </Text>
        <Text style={styles.wrap}>{voter.pollingBooth}</Text>

        <Text style={styles.row}>
          <Text style={styles.label}>पत्ता:</Text>
        </Text>
        <Text style={styles.wrap}>{voter.pollingBoothAddress}</Text>

        <View style={styles.divider} />

        {/* Date & Time */}
        <Text style={styles.inline}>
          <Text style={styles.label}>दिनांक:</Text> {date}
        </Text>

        {time ? (
          <Text style={styles.inline}>
            <Text style={styles.label}>वेळ:</Text> {time}
          </Text>
        ) : null}

        <View style={{ height: 12 }} />
      </View>
    </ViewShot>
  );
});

export default SlipPreview;

const styles = StyleSheet.create({
  slip: {
    width: 384,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  row: {
    fontSize: 26,
    marginVertical: 1,
  },
  inline: {
    fontSize: 26,
    marginVertical: 1,
  },
  wrap: {
    fontSize: 26,
    lineHeight: 34,
    marginBottom: 1,
  },
  label: {
    fontWeight: "700",
    fontSize: 26,
  },
  divider: {
    height: 3,
    backgroundColor: "#000",
    marginVertical: 8,
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 1,
  },
  symbol: {
    width: 70,
    height: 70,
    marginLeft: 12,
    resizeMode: "contain",
  },
  headerImage: {
    width: "100%",
    height: 90,
    resizeMode: "contain",
    marginBottom: 6,
  },
});