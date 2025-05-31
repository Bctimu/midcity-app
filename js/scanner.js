import { Html5Qrcode } from "https://unpkg.com/html5-qrcode?module";
import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const resultContainer = document.getElementById("result");
const expirationContainer = document.getElementById("expiration");

async function checkToken(tokenStr) {
  const docRef = doc(db, "tokens", tokenStr);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    resultContainer.textContent = "❌ Invalid or unknown QR Code";
    resultContainer.style.color = "red";
    expirationContainer.textContent = "";
    return;
  }

  const data = docSnap.data();
  const now = Date.now();

  if (now > data.expiresAt) {
    resultContainer.textContent = "❌ QR Code expired";
    resultContainer.style.color = "red";
    expirationContainer.textContent = "";
    return;
  }

  resultContainer.textContent = `✅ Verified Resident: ${data.uid}`;
  resultContainer.style.color = "green";

  // Show expiration countdown
  showExpirationCountdown(data.expiresAt);
}

function showExpirationCountdown(expiresAt) {
  function update() {
    const now = Date.now();
    const diff = expiresAt - now;
    if (diff <= 0) {
      expirationContainer.textContent = "QR Code expired";
      resultContainer.textContent = "❌ QR Code expired";
      resultContainer.style.color = "red";
      clearInterval(timer);
      return;
    }
    expirationContainer.textContent = `Expires in: ${Math.ceil(diff / 1000)}s`;
  }
  update();
  const timer = setInterval(update, 1000);
}

function onScanSuccess(decodedText) {
  try {
    const tokenStr = decodedText;
    checkToken(tokenStr);
  } catch (error) {
    resultContainer.textContent = "❌ Invalid QR Code format";
    resultContainer.style.color = "red";
  }
}

new Html5Qrcode("reader").start(
  { facingMode: "environment" },
  {
    fps: 10,
    qrbox: 250,
  },
  onScanSuccess
);
