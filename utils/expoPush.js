const { Expo } = require('expo-server-sdk');
const expo = new Expo();

exports.sendExpoPush = async (tokens, title, body, data = {}) => {
  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((t) => ({ to: t, sound: 'default', title, body, data }));

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Expo push error', err);
    }
  }
};
