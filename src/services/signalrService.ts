import * as signalR from '@microsoft/signalr';
import Constants from 'expo-constants';

let connection: signalR.HubConnection | null = null;
const joinedGroups: Set<string> = new Set();
const subscribers: Record<string, Set<(...args: any[]) => void>> = {};

/**
 * Start SignalR connection (idempotent)
 */
export const startConnection = async (accessToken: string) => {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    console.log('⚠️ SignalR already connected');
    return;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${Constants.expoConfig.extra.API}/videoProgressHub`, {
      accessTokenFactory: () => accessToken,
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Rejoin groups after reconnect
  connection.onreconnected(async () => {
    console.log('🔁 SignalR reconnected. Rejoining groups...');
    await joinGroups(Array.from(joinedGroups));
  });

  // Register existing subscribers
  Object.entries(subscribers).forEach(([event, callbacks]) => {
    callbacks.forEach((cb) => connection!.on(event, cb));
  });

  try {
    await connection.start();
    console.log('✅ SignalR connected');
  } catch (error) {
    console.error('❌ SignalR connection error:', error);
  }
};

/**
 * Join one or multiple groups (idempotent)
 */
export const joinGroups = async (groups: string | string[]) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn('⚠️ Cannot join groups: SignalR not connected');
    return;
  }

  const groupList = Array.isArray(groups) ? groups : [groups];

  for (const g of groupList) {
    if (!joinedGroups.has(g)) {
      try {
        await connection.invoke('JoinGroup', g);
        joinedGroups.add(g);
        console.log(`✅ Joined group: ${g}`);
      } catch (err) {
        console.error(`❌ Failed to join group ${g}:`, err);
      }
    }
  }
};

/**
 * Leave group
 */
export const leaveGroups = async (groups: string | string[]) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn('⚠️ Cannot leave groups: SignalR not connected');
    return;
  }

  const groupList = Array.isArray(groups) ? groups : [groups];

  for (const g of groupList) {
    if (joinedGroups.has(g)) {
      try {
        await connection.invoke('LeaveGroup', g);
        joinedGroups.delete(g);
        console.log(`✅ Left group: ${g}`);
      } catch (err) {
        console.error(`❌ Failed to leave group ${g}:`, err);
      }
    }
  }
};

/**
 * Register event (idempotent)
 */
export const onEvent = (event: string, callback: (...args: any[]) => void) => {
  if (!subscribers[event]) subscribers[event] = new Set();
  if (!subscribers[event].has(callback)) {
    subscribers[event].add(callback);
    if (connection) connection.on(event, callback);
  }
};

/**
 * Stop connection
 */
export const stopConnection = async () => {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
    console.log('🛑 SignalR stopped');
  }
  connection = null;
  joinedGroups.clear();
  Object.keys(subscribers).forEach((k) => subscribers[k].clear());
};
