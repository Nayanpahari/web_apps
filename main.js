import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit
} from "firebase/firestore";

// Firebase config from Vite .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game logic
let wallet = 5000000000000;
let challengeActive = false;
let timerInterval = null;

const walletEl = document.getElementById("wallet");
const timerEl = document.getElementById("timer");

// Submit score to Firestore
async function submitScore(playerName, score) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      name: playerName || "Anonymous",
      score,
      timestamp: Date.now()
    });
    await loadLeaderboard();
  } catch (e) {
    console.error("Error submitting score:", e);
  }
}

// Load leaderboard from Firestore
async function loadLeaderboard() {
  try {
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    const leaderboardEl = document.getElementById("leaderboard");
    leaderboardEl.innerHTML = "<h3>🏆 Global Leaderboard</h3><ul>";
    querySnapshot.forEach(doc => {
      const data = doc.data();
      leaderboardEl.innerHTML += `<li><strong>${data.name}</strong>: $${data.score.toLocaleString()}</li>`;
    });
    leaderboardEl.innerHTML += "</ul>";
  } catch (e) {
    console.error("Error loading leaderboard:", e);
  }
}

// Start challenge with timer
function startChallenge() {
  const time = parseInt(document.getElementById("challengeTime").value);
  wallet = 5000000000000;
  challengeActive = true;
  walletEl.textContent = `💰 Wallet: $${wallet.toLocaleString()}`;
  renderItems();

  let remaining = time;
  timerEl.textContent = `⏱ Time Left: ${remaining}s`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    timerEl.textContent = `⏱ Time Left: ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      challengeActive = false;
      const playerName = prompt("⏰ Time's up! Enter your name:");
      if (playerName !== null) submitScore(playerName.trim(), wallet);
      wallet = 5000000000000;
      walletEl.textContent = `💰 Wallet: $${wallet.toLocaleString()}`;
      timerEl.textContent = "";
    }
  }, 1000);
}

// Generate sharable challenge link
function generateChallengeLink() {
  const time = parseInt(document.getElementById("challengeTime").value);
  const link = `${window.location.origin}${window.location.pathname}?challenge=${time}`;
  const shareEl = document.getElementById("shareLink");
  shareEl.innerHTML = `Share this link: <input value="${link}" readonly style="width:100%">`;
}

// Render item cards with dynamic prices
function renderItems() {
  const items = [
    { name: "Jet", basePrice: 1e9, img: "https://img.icons8.com/color/96/airplane.png" },
    { name: "Island", basePrice: 15e9, img: "https://img.icons8.com/color/96/island.png" },
    { name: "Car", basePrice: 7e7, img: "https://img.icons8.com/color/96/car.png" },
    { name: "Laptop", basePrice: 2000, img: "https://img.icons8.com/color/96/laptop.png" },
    { name: "Burger", basePrice: 10, img: "https://img.icons8.com/color/96/hamburger.png" },
    { name: "Yacht", basePrice: 5e8, img: "https://img.icons8.com/color/96/yacht.png" },
    { name: "Helicopter", basePrice: 3e8, img: "https://img.icons8.com/color/96/helicopter.png" },
    { name: "Castle", basePrice: 7.5e8, img: "https://img.icons8.com/color/96/castle.png" },
    { name: "Robot", basePrice: 250000, img: "https://img.icons8.com/color/96/robot-2.png" },
    { name: "Gaming PC", basePrice: 4000, img: "https://img.icons8.com/color/96/monitor.png" },
    { name: "Rocket", basePrice: 5e9, img: "https://img.icons8.com/color/96/rocket.png" }
  ];

  const itemList = document.getElementById("itemList");
  itemList.innerHTML = "";
  items.forEach(item => {
    const price = Math.floor(item.basePrice * (Math.random() * 0.4 + 0.8));
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <h4>${item.name}</h4>
      <p>Price: $${price.toLocaleString()}</p>
      <button>Buy</button>
    `;
    div.querySelector("button").onclick = () => buyItem(price);
    itemList.appendChild(div);
  });
}

// Buy item logic
function buyItem(price) {
  if (!challengeActive) return alert("Start a challenge!");
  if (wallet >= price) {
    wallet -= price;
    walletEl.textContent = `💰 Wallet: $${wallet.toLocaleString()}`;
  } else {
    alert("Not enough money!");
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn").addEventListener("click", startChallenge);
  document.getElementById("linkBtn").addEventListener("click", generateChallengeLink);

  renderItems();
  loadLeaderboard();

  const params = new URLSearchParams(window.location.search);
  const challenge = params.get("challenge");
  if (challenge) {
    document.getElementById("challengeTime").value = challenge;
    startChallenge();
  }
});
