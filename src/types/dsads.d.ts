declare module "react-native-compressor" {
  export namespace Video {
    function getThumbnail(
      fileUrl: string
    ): Promise<string>;
  }
}