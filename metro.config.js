const { getDefaultConfig } = require("expo/metro-config");

/** Stellt sicher, dass u. a. .mp4 wie vorgesehen als Asset gebündelt wird */
module.exports = getDefaultConfig(__dirname);
