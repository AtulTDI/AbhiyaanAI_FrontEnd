import { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Divider,
  List,
} from "react-native-paper";
import {
  ResizeMode,
  Video as ExpoVideo,
  AVPlaybackStatusSuccess,
} from "expo-av";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import CommonUpload from "./CommonUpload";
import { AppTheme } from "../theme";

interface FormData {
  campaign: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  errors: {
    campaign?: string;
    file?: string;
  };
}

type Props = {
  onAddVideo: (data: any) => void;
  setShowAddView: (val: boolean) => void;
  uploading: boolean;
};

export default function VideoUploadForm({
  onAddVideo,
  setShowAddView,
  uploading,
}: Props) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const screenWidth = Dimensions.get("window").width;

  const [formData, setFormData] = useState<FormData>({
    campaign: "",
    file: null,
    errors: {},
  });
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleGenerateDummy = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required to generate sample video");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/generate-dummy", {
        name: name.trim(),
      });

      const uri =
        response.data?.uri || "http://localhost:4566/your-generated.mp4";
      setGeneratedUri(uri);
      Alert.alert("Success", "Sample video generated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to generate sample video");
    } finally {
      setLoading(false);
      setGeneratedUri(
        "http://localhost:4566/my-local-bucket/c8f368a2-df26-44d2-9c54-cbfe78d078de/sdadsadadsadsa/Video_1_20250712103047.mp4"
      );
    }
  };

  const handleSubmit = () => {
    const errors: FormData["errors"] = {};
    if (!formData.campaign.trim())
      errors.campaign = "Campaign name is required";
    if (!formData.file) errors.file = "Please upload a base video";

    if (Object.keys(errors).length > 0) {
      setFormData((prev) => ({ ...prev, errors }));
      return;
    }

    const payload = {
      campaign: formData.campaign.trim(),
      ...(generatedUri ? { file: generatedUri } : { file: formData.file }),
    };

    onAddVideo(payload);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 160,
          }}
        >
          {/* Campaign */}
          <TextInput
            label="Campaign"
            value={formData.campaign}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                campaign: text,
                errors: { ...prev.errors, campaign: undefined },
              }))
            }
            mode="outlined"
            style={styles.input}
            error={!!formData.errors.campaign}
          />
          <HelperText type="error" visible={!!formData.errors.campaign}>
            {formData.errors.campaign}
          </HelperText>

          {/* Upload Base Video */}
          <CommonUpload
            label="Upload Base Video"
            fileType="video"
            onUpload={(file) =>
              setFormData((prev) => ({
                ...prev,
                file,
                errors: { ...prev.errors, file: undefined },
              }))
            }
            onCancel={() => {
              setFormData((prev) => ({ ...prev, file: null }));
              setGeneratedUri(null);
            }}
          />
          {formData.errors.file && (
            <HelperText type="error" visible>
              {formData.errors.file}
            </HelperText>
          )}

          {/* Optional Generate Section */}
          {formData.file && (
            <>
              <Divider style={{ marginVertical: 20 }} />

              <List.Accordion
                title="Generate Sample Video (Optional)"
                expanded={expanded}
                onPress={() => setExpanded(!expanded)}
                titleStyle={{
                  fontWeight: "bold",
                  color: theme.colors.primary,
                }}
              >
                <View style={{ marginTop: 16 }}>
                  <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                  />
                  <View style={{ width: "100%", alignItems: "flex-end" }}>
                    <Button
                      mode="contained"
                      onPress={handleGenerateDummy}
                      loading={loading}
                      style={{ marginTop: 8, borderRadius: 5 }}
                    >
                      Generate & Preview
                    </Button>
                  </View>

                  {generatedUri && (
                    <View style={{ marginTop: 16 }}>
                      <Text
                        variant="titleMedium"
                        style={{ marginBottom: 8, color: colors.primary }}
                      >
                        Preview:
                      </Text>

                      <ExpoVideo
                        source={{ uri: generatedUri }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay
                        onLoad={(status) => {
                          if ("isLoaded" in status && status.isLoaded) {
                            const { naturalSize } =
                              status as AVPlaybackStatusSuccess & {
                                naturalSize: {
                                  width: number;
                                  height: number;
                                  orientation?: "portrait" | "landscape";
                                };
                              };

                            if (naturalSize?.width && naturalSize?.height) {
                              const isPortrait =
                                naturalSize.orientation === "portrait" &&
                                naturalSize.height > naturalSize.width;

                              setVideoDimensions({
                                width: isPortrait
                                  ? naturalSize.height
                                  : naturalSize.width,
                                height: isPortrait
                                  ? naturalSize.width
                                  : naturalSize.height,
                              });
                            }
                          }
                        }}
                        style={{
                          width: "100%",
                          height:
                            Platform.OS !== "web" &&
                            videoDimensions.width &&
                            videoDimensions.height
                              ? (videoDimensions.height /
                                  videoDimensions.width) *
                                screenWidth
                              : undefined,
                          maxWidth: 800,
                          aspectRatio: 16 / 9,
                          backgroundColor: colors.black,
                          borderRadius: 8,
                          marginTop: 12,
                          alignSelf: "center",
                        }}
                      />
                    </View>
                  )}
                </View>
              </List.Accordion>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => setShowAddView(false)}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            icon="upload"
            onPress={handleSubmit}
            disabled={!formData.file || uploading}
            loading={uploading}
            style={styles.actionButton}
          >
            Upload Base Video
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    input: {
      marginBottom: 12,
      backgroundColor: theme.colors.white,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: theme.colors.white,
      borderTopWidth: 1,
      borderTopColor: theme.colors.lightGray,
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      borderRadius: 6,
    },
  });
