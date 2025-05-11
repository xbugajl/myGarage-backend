const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const sendEmail = async (to, subject, text, html, template, data) => {
  try {
    const emailDoc = {
      to,
      message: {
        subject,
        text,
        html,
      },
    };
    if (template) {
      emailDoc.template = {
        name: template,
        data: data || {},
      };
    }
    await db.collection('mail').add(emailDoc);
    console.log(`Email queued for ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

module.exports = { db, admin, sendEmail };