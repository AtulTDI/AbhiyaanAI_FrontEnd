import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, useTheme, Surface, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView } from "react-native-gesture-handler";
import {
  TabView,
  SceneMap,
  TabBar,
  SceneRendererProps,
  TabBarItem,
} from "react-native-tab-view";
import { User } from "../types/User";
import UserForm from "../components/UserForm";
import UserUpload from "../components/UserUpload";
import UserTable from "../components/UserTable";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import { useToast } from "../components/ToastProvider";
import {
  createUser,
  deleteUserById,
  editUserById,
  getUsers,
} from "../api/userApi";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";

type TabRoute = {
  key: string;
  title: string;
};

export default function AddUserScreen() {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const layout = useWindowDimensions();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [index, setIndex] = useState(0);
  const [showAddUserView, setShowAddUserView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [routes] = useState<TabRoute[]>([
    { key: "manual", title: "Register User" },
    { key: "excel", title: "Bulk Register" },
  ]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      setUsers(
        response?.data && Array.isArray(response.data) ? response.data : []
      );
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to load users"), "error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAddUserView(false);
      setUserToEdit(null);
      fetchUsers();
    }, [fetchUsers])
  );

  const addUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
  }) => {
    try {
      await createUser({
        ...userData,
        model: null,
        applicationId: "b2177e95-c3f3-4d6b-b2f9-d3dbfa4529e2",
      });
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast("User registered successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to create user"), "error");
    }
  };

  const editUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    password: string;
  }) => {
    try {
      await editUserById(userToEdit.id, userData);
      await fetchUsers();
      setShowAddUserView(false);
      setUserToEdit(null);
      showToast("User updated successfully!", "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error, "Failed to update user"), "error");
    }
  };

  const handleEdit = (item: User) => {
    setUserToEdit(item);
    setShowAddUserView(true);
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedUserId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUserId) {
      try {
        await deleteUserById(selectedUserId);
        await fetchUsers();
        showToast("User deleted successfully!", "success");
      } catch (error: any) {
        showToast(extractErrorMessage(error, "Failed to delete user"), "error");
      }
      setSelectedUserId(null);
      setDeleteDialogVisible(false);
    }
  };

  const renderScene = SceneMap({
    manual: () => (
      <UserForm
        key="user-form"
        mode="create"
        onCreate={addUser}
        userToEdit={null}
        setUserToEdit={setUserToEdit}
        setShowAddUserView={setShowAddUserView}
      />
    ),
    excel: () => (
      <UserUpload
        fetchUsers={fetchUsers}
        setShowAddUserView={setShowAddUserView}
      />
    ),
  });

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: { index: number; routes: TabRoute[] };
    }
  ) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.warning, height: 3 }}
      style={{ backgroundColor: colors.white, elevation: 2 }}
      renderTabBarItem={({ route, key, ...rest }) => {
        const focused =
          props.navigationState.index ===
          props.navigationState.routes.findIndex((r) => r.key === route.key);

        return (
          <TabBarItem
            {...rest}
            key={key}
            route={route}
            labelText={route.title}
            labelStyle={{
              color: focused ? colors.warning : colors.darkGrayText,
              fontWeight: focused ? "600" : "500",
              fontSize: 14,
              textTransform: "capitalize",
              marginVertical: 8,
            }}
          />
        );
      }}
    />
  );

  return (
    <>
      <Surface style={styles.container} elevation={1}>
        {/* Header with title and add button */}
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={[styles.heading, { color: theme.colors.primary }]}
          >
            Users
          </Text>
          {!showAddUserView && (
            <Button
              mode="contained"
              onPress={() => setShowAddUserView(true)}
              icon="plus"
              labelStyle={{
                fontWeight: "bold",
                fontSize: 14,
                color: theme.colors.onPrimary,
              }}
              buttonColor={theme.colors.primary}
              style={{ borderRadius: 5 }}
            >
              Add User(s)
            </Button>
          )}
        </View>

        {showAddUserView ? (
          <>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {userToEdit ? (
                  <UserForm
                    mode="edit"
                    onCreate={userToEdit ? editUser : addUser}
                    userToEdit={userToEdit}
                    setUserToEdit={setUserToEdit}
                    setShowAddUserView={setShowAddUserView}
                  />
                ) : (
                  <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    renderTabBar={renderTabBar}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    lazy
                  />
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        )}
      </Surface>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteUser}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  heading: {
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
});
