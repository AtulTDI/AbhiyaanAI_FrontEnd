import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;
let joinedGroups: string[] = [];

export const startConnection = async (accessToken: string) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.EXPO_PUBLIC_API}/videoProgressHub`, {
      accessTokenFactory: () => accessToken,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  connection.onreconnected(async () => {
    console.log("🔁 SignalR reconnected. Rejoining groups...");
    await joinGroups(joinedGroups);
  });

  try {
    await connection.start();
    console.log("✅ SignalR connected.");
  } catch (error) {
    console.error("❌ SignalR connection error:", error);
  }
};

export const joinGroups = async (userInput: string | string[]) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn("⚠️ Cannot join groups: SignalR is not connected.");
    return;
  }

  const userIds = Array.isArray(userInput) ? userInput : [userInput];

  for (const userId of userIds) {
    try {
      await connection.invoke("JoinGroup", userId);
      console.log(`✅ Joined group: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to join group ${userId}:`, error);
    }
  }

  joinedGroups = [...new Set([...joinedGroups, ...userIds])];
};

export const registerOnServerEvents = (
  eventName: string,
  callback: (...args: any[]) => void
) => {
  if (!connection) {
    console.warn("⚠️ SignalR not initialized.");
    return;
  }

  connection.on(eventName, callback);
};

export const stopConnection = async () => {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
    console.log("🛑 SignalR connection stopped.");
    connection = null;
    joinedGroups = [];
  }
};