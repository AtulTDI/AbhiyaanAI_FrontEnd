import React, { useRef, useState } from "react";
import { TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CommonTable from "./CommonTable";
import { Channel } from "../types/Channel";
import { AppTheme } from "../theme";

export default function ChannelsTable({
  channels,
  onDelete,
  onUpdateSettings,
}) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const loopAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = () => {
    spinValue.setValue(0);
    loopAnimation.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loopAnimation.current.start();
  };

  const stopSpin = () => {
    if (loopAnimation.current) {
      loopAnimation.current.stop();
      loopAnimation.current = null;
    }
    spinValue.setValue(0);
  };

  const handleSettingsClick = async (id: string) => {
    setLoadingId(id);
    startSpin();
    try {
      await onUpdateSettings(id);
    } finally {
      setLoadingId(null);
      stopSpin();
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const columns = [
    {
      label: "Name",
      key: "name",
      flex: 3,
    },
    {
      label: "Settings",
      key: "settings",
      flex: 3,
      render: (item: Channel) => (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => handleSettingsClick(item.id)}
          activeOpacity={0.7}
        >
          <Animated.View
            style={{
              transform: [{ rotate: loadingId === item.id ? spin : "0deg" }],
            }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      ),
    },
    {
      label: "Action",
      key: "actions",
      flex: 1,
      render: (item: Channel) => (
        <Ionicons
          name="trash-outline"
          size={20}
          color="red"
          onPress={() => onDelete(item.id)}
        />
      ),
    },
  ];

  return (
    <CommonTable
      data={channels}
      columns={columns}
      emptyIcon={<Ionicons name="radio-outline" size={48} color="#999" />}
      emptyText="No channels found"
    />
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    padding: 6,
    borderRadius: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
});