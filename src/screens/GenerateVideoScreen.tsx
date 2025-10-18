import React, { useCallback, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Surface, Text, Button, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import SelectBaseVideo from "../components/SelectBaseVideo";
import SelectVoters from "../components/SelectVoters";
import { useToast } from "../components/ToastProvider";
import { navigate } from "../navigation/NavigationService";
import { getAuthData } from "../utils/storage";
import { extractErrorMessage } from "../utils/common";
import { joinGroups, startConnection } from "../services/signalrService";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import {
  generateCustomisedVideo,
  getInProgressVideoCount,
} from "../api/videoApi";
import { AppTheme } from "../theme";

export default function GenerateVideoScreen() {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme, { isWeb, isMobileWeb });
  const { colors } = theme;

  const [activeStep, setActiveStep] = useState(0);
  const { showToast } = useToast();
  const [stepData, setStepData] = useState({
    0: null,
    1: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalVoterCount, setTotalVoterCount] = useState(0);
  const [selectedVoterCount, setSelectedVoterCount] = useState(0);
  const steps = [t("selectBaseVideo"), t("selectVoters")];

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function checkCountAndReset() {
        try {
          const response = await getInProgressVideoCount();
          if (active) {
            setShowOverlay((response?.data?.count ?? 0) > 0);
            if ((response?.data?.count ?? 0) === 0) {
              setActiveStep(0);
              setStepData({ 0: null, 1: [] });
            }
          }
        } catch (error) {
          if (active) {
            setShowOverlay(false);
            setActiveStep(0);
            setStepData({ 0: null, 1: [] });
          }
        }
      }

      checkCountAndReset();

      return () => {
        active = false;
      };
    }, [])
  );

  const generateVideo = async () => {
    const payload = {
      baseVideoId: stepData[0],
      recipientIds: stepData[1],
    };

    try {
      await generateCustomisedVideo(payload);
      showToast(t("video.generateVideoStart"), "success");
      navigate("Processing");
    } catch (error: any) {
      showToast(
        extractErrorMessage(error, t("video.generateVideoFail")),
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
      showToast(t("voter.selectOneVoter"), "warning");
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
            getTotalVotersCount={(count) => setTotalVoterCount(count)}
            getSelectedVotersCount={(count) => setSelectedVoterCount(count)}
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

      {/* Count Section */}
      {activeStep === 1 && (
        <Surface
          style={[styles.countContainer, { marginTop: isWeb && !isMobileWeb ? -15 : 10 }]}
        >
          <Ionicons
            name="people-circle-outline"
            size={isWeb && !isMobileWeb ? 28 : 20}
            color={colors.primary}
            style={{ marginRight: isWeb && !isMobileWeb ? 10 : 6 }}
          />
          <Text style={[styles.countText, { fontSize: isWeb && !isMobileWeb ? 16 : 12 }]}>
            {t("selected")}:{" "}
            <Text
              style={[styles.countHighlight, { fontSize: isWeb && !isMobileWeb ? 16 : 12 }]}
            >
              {selectedVoterCount} /{" "}
            </Text>
            {totalVoterCount}
          </Text>
        </Surface>
      )}

      {/* Step Content */}
      <View style={[styles.content, { marginTop: activeStep === 1 ? 0 : 10 }]}>
        {renderStepContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttons}>
        <Button
          mode="outlined"
          onPress={handleBack}
          disabled={activeStep === 0}
          style={styles.btn}
        >
          {t("previous")}
        </Button>
        <Button
          mode="contained"
          onPress={
            activeStep === steps.length - 1 ? handleGenerate : handleNext
          }
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
              ? t("video.generating")
              : t("video.generateVideo")
            : t("next")}
        </Button>
      </View>

      {/* Blocking Overlay */}
      {showOverlay && (
        <View style={styles.overlay}>
          <View style={styles.overlayMessageContainer}>
            <Ionicons
              name="time-outline"
              size={50}
              color={colors.primary}
              style={{ marginBottom: 20, opacity: 0.85 }}
            />
            <Text style={styles.overlayMessageTitle}>
              {t("video.processingProgress")}
            </Text>
            <Text style={styles.overlayMessageText}>
              {t("video.videoGenerationProgress")}
            </Text>
            <Text style={styles.overlayMessageText}>
              {t("video.waitForCompletion")}
            </Text>
          </View>
        </View>
      )}
    </Surface>
  );
}

const createStyles = (
  theme: AppTheme,
  platform: { isWeb: boolean; isMobileWeb: boolean }
) =>
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
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      paddingHorizontal: 20,
    },
    overlayMessageContainer: {
      backgroundColor: theme.colors.white,
      borderRadius: 20,
      paddingVertical: 30,
      paddingHorizontal: 25,
      width: platform.isWeb && !platform.isMobileWeb ? "50%" : "100%",
      alignItems: "center",
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 12,
    },
    overlayMessageTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.primary,
      marginBottom: 12,
      textAlign: "center",
    },
    overlayMessageText: {
      fontSize: 16,
      color: theme.colors.darkGrayText,
      textAlign: "center",
      marginBottom: 6,
      lineHeight: 22,
    },
    countContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    countText: {
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    countHighlight: {
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
  });
