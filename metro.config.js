const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const WEB_STUBS = {
  'react-native-vision-camera': './stubs/vision-camera.stub.js',
  'react-native-contacts': './stubs/contacts.stub.js',
  'react-native-fs': './stubs/fs.stub.js',
  'react-native-share': './stubs/share.stub.js',
  'react-native-walkthrough-tooltip': './stubs/walkthrough-tooltip.stub.js'
};

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  config.resolver.assetExts.push('xlsx', 'mp4');

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && WEB_STUBS[moduleName]) {
      return {
        filePath: path.resolve(__dirname, WEB_STUBS[moduleName]),
        type: 'sourceFile'
      };
    }

    if (platform !== 'web' && moduleName.endsWith('.css')) {
      return {
        filePath: path.resolve(__dirname, './stubs/empty.stub.js'),
        type: 'sourceFile'
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();
