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

export const joinGroups = async (voterIds: string[]) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn("⚠️ Cannot join groups: SignalR is not connected.");
    return;
  }

  for (const voterId of voterIds) {
    try {
      await connection.invoke("JoinGroup", voterId);
      console.log(`✅ Joined group: ${voterId}`);
    } catch (error) {
      console.error(`❌ Failed to join group ${voterId}:`, error);
    }
  }

  joinedGroups = [...new Set([...joinedGroups, ...voterIds])];
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