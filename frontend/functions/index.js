const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// ✅ Firestore trigger: when a letter is approved/declined
exports.notifyStudentOnApproval = functions.firestore
    .document("requests/{requestId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Only act if status changed
      if (before.status === after.status) return null;

      const status = after.status;
      const email = after.studentEmail;
      const name = after.studentName || "Student";
      const comment = after.comment || "No comment provided.";
      const signedLetter = after.signedLetter || "Not yet available.";

      if (!email) {
        console.log("No studentEmail found.");
        return null;
      }

      if (status === "approved") {
        console.log(`📬 [APPROVED] Letter approved for ${name} (${email})`);
        console.log(`Signed Letter Link: ${signedLetter}`);
      } else {
        console.log(`📬 [DECLINED] Letter declined for ${name} (${email})`);
        console.log(`Reason: ${comment}`);
      }

      return null;
    });
