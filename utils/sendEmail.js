const admin = require('firebase-admin');
     const db = admin.firestore();
     const mailCollection = db.collection('mail'); // Replace 'mail' if you customized the collection name

     async function sendEmail(to, subject, html) {
       try {
         await mailCollection.add({
           to: to,
           message: {
             subject: subject,
             html: html,
           },
         });
         console.log('Email queued for sending');
       } catch (error) {
         console.error('Error queuing email:', error);
       }
     }

     // Example usage
     sendEmail('recipient@example.com', 'Welcome!', '<p>Hello from Firebase!</p>');