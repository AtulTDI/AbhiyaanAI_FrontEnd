import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import SelectBaseVideo from "../components/SelectBaseVideo";
import SelectVoters from "../components/SelectVoters";
import { useToast } from "../components/ToastProvider";
import { navigate } from "../navigation/NavigationService";
import { getAuthData } from "../utils/storage";
import { extractErrorMessage } from "../utils/common";
import { joinGroups, startConnection } from "../services/signalrService";
import { generateCustomisedVideo } from "../api/videoApi";
import { AppTheme } from "../theme";

const steps = ["Select Base Video", "Select Voters"];

export default function GenerateVideoScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const [activeStep, setActiveStep] = useState(0);
  const { showToast } = useToast();
  const [stepData, setStepData] = useState({
    0: null,
    1: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateVideo = async () => {
    const payload = {
      baseVideoId: stepData[0],
      recipientIds: stepData[1],
    };

    try {
      await generateCustomisedVideo(payload);
      showToast("Video Generation started", "success");
      navigate("Processing");
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, "Failed to generate videos"),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setupSignalR = async () => {
    const { accessToken } = await getAuthData();

    await startConnection(accessToken);
    await joinGroups(stepData?.[1]);
    await generateVideo();
  };

  const handleGenerate = async () => {
    if (!stepData[1] || stepData[1].length === 0) {
      showToast("Please select at least one voter", "warning");
      return;
    }

    setIsLoading(true);
    await setupSignalR();
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <SelectBaseVideo stepData={stepData} setStepData={setStepData} />
        );
      case 1:
        return (
          <SelectVoters
            stepData={stepData}
            setStepData={setStepData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Custom Stepper */}
      <View style={styles.stepperContainer}>
        {steps.map((label, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <View key={label} style={styles.step}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: isCompleted
                      ? colors.success
                      : isActive
                      ? colors.primary
                      : colors.background,
                    borderColor: isCompleted
                      ? colors.success
                      : isActive
                      ? colors.primary
                      : colors.background,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                ) : (
                  <Text
                    style={{
                      color: isActive ? colors.white : colors.outline,
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  textAlign: "center",
                  color: isActive ? colors.primary : colors.outline,
                  fontWeight: isActive ? "bold" : "normal",
                }}
              >
                {label}
              </Text>

              {index < steps.length - 1 && (
                <View style={styles.lineConnector} />
              )}
            </View>
          );
        })}
      </View>

      {/* Step Content */}
      <View style={styles.content}>{renderStepContent()}</View>

      {/* Navigation Buttons */}
      <View style={styles.buttons}>
        <Button
          mode="outlined"
          onPress={handleBack}
          disabled={activeStep === 0}
          style={styles.btn}
        >
          Previous
        </Button>
        <Button
          mode="contained"
          onPress={activeStep === steps.length - 1 ? handleGenerate : handleNext}
          loading={isLoading}
          disabled={
            !stepData[0] ||
            (activeStep === 1 && stepData[1].length === 0) ||
            isLoading
          }
          style={styles.btn}
        >
          {activeStep === steps.length - 1
            ? isLoading
              ? "Generating..."
              : "Generate Video"
            : "Next"}
        </Button>
      </View>
    </Surface>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      flex: 1,
      backgroundColor: theme.colors.white,
    },
    stepperContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      marginBottom: 24,
      position: "relative",
    },
    step: {
      alignItems: "center",
      flex: 1,
    },
    circle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    lineConnector: {
      position: "absolute",
      top: 16,
      right: -Dimensions.get("window").width / 6 + 16,
      height: 2,
      width: Dimensions.get("window").width / 3 - 32,
      backgroundColor: theme.colors.borderGray,
      zIndex: -1,
    },
    content: {
      flex: 1,
      marginTop: 10,
    },
    buttons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    btn: {
      flex: 1,
      marginHorizontal: 6,
      borderRadius: 8,
    },
  });
