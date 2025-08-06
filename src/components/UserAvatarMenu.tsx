import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Avatar, Divider, Menu, Text, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { AppTheme } from "../theme";

interface Props {
  userName: string;
  email: string;
  role: string;
}

const UserAvatarMenu: React.FC<Props> = ({ userName, email, role }) => {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ position: "relative", alignItems: "flex-end" }}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setVisible(true)}>
            <Avatar.Text
              label={userName?.charAt(0)?.toUpperCase()}
              size={38}
              style={{
                backgroundColor: colors.primary,
                elevation: 4,
              }}
              labelStyle={{
                color: colors.white,
                fontWeight: "500",
              }}
            />
          </TouchableOpacity>
        }
        anchorPosition="bottom"
        contentStyle={{
          backgroundColor: colors.white,
          borderRadius: 12,
          elevation: 6,
          minWidth: 250,
          paddingTop: 0,
          paddingBottom: 8,
          marginTop: 5
        }}
      >
        {/* Name Header with Orange Background */}
        <View
          style={{
            backgroundColor: colors.softOrange,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.darkOrange,
            }}
          >
            {userName}
          </Text>
        </View>

        <Divider style={{ backgroundColor: colors.divider }} />

        {/* Email */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            Email
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="email" size={16} color={colors.textTertiary} />
            <Text style={{ fontSize: 14, color: colors.textPrimary }}>
              {email}
            </Text>
          </View>
        </View>

        <Divider
          style={{ backgroundColor: colors.divider, marginVertical: 4 }}
        />

        {/* Role */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            Role
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons
              name="person"
              size={16}
              color={colors.textTertiary}
            />
            <Text
              style={{
                fontSize: 14,
                color: colors.textPrimary,
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {role}
            </Text>
          </View>
        </View>
      </Menu>
    </View>
  );
};

export default UserAvatarMenu;
