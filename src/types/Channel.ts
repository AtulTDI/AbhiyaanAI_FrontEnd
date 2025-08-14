export type Channel = {
  id?: string;
  name: string;
  isActive?: boolean;
}

export type CreateChannelPayload = {
  channelName: string;
  applicationId: string;
}
