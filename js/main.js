import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js";
import { db } from "./firebaseConfig.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const userIdInput = document.getElementById("userId");
const qrCodeContainer = document.getElementById("qrcode");
const countdownEl = document.getElementById("countdown");

const EXPIRATION_TIME_MS = 60 * 1000; // 1 minute expiration

async function generateQRCode() {
  const userId = userIdInput.value.trim();
  if (!userId) {
    alert("Please enter a valid User ID");
    return;
  }

  const now = Date.now();
  const expiresAt = now + EXPIRATION_TIME_MS;

  // Create token object
  const tokenData = {
    uid: userId,
    issuedAt: now,
    expiresAt: expiresAt,
  };

  // Convert to JSON string
  const tokenStr = JSON.stringify(tokenData);

  // Generate QR code from tokenStr
  qrCodeContainer.innerHTML = "";
  try {
    await QRCode.toCanvas(qrCodeContainer, tokenStr, { width: 250 });
  } catch (err) {
    console.error("QR Code generation error:", err);
  }

  startCountdown(expiresAt);

  // Save token to Firestore
  try {
    await setDoc(doc(db, "tokens", tokenStr), {
      uid: userId,
      issuedAt: serverTimestamp(),
      expiresAt: expiresAt,
      token: tokenStr,
    });
  } catch (err) {
    console.error("Error saving token to Firestore:", err);
  }
}

function startCountdown(expiresAt) {
  function update() {
    const now = Date.now();
    const diff = expiresAt - now;
    if (diff <= 0) {
      countdownEl.textContent = "QR Code expired";
      qrCodeContainer.innerHTML = "";
      clearInterval(timer);
      return;
    }
    countdownEl.textContent = `Expires in: ${Math.ceil(diff / 1000)}s`;
  }
  update();
  const timer = setInterval(update, 1000);
}

userIdInput.addEventListener("input", generateQRCode);

// Generate on load for default userId
generateQRCode();
