import { db, leaderboardRef, push, onValue, remove } from "../config/firebase.js";

const ADMIN_PWD = import.meta.env.VITE_ADMIN_PASSWORD || "Thanh160209";

export async function saveScore(playerName, totalScore) {
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const payload = {
    name: playerName?.trim() || "Võ sinh ẩn danh",
    score: Number(totalScore) || 0,
    time: timeStr,
    timestamp: Date.now()
  };

  try {
    let localLb = JSON.parse(localStorage.getItem('fsc_local_lb') || '[]');
    localLb.push(payload);
    localStorage.setItem('fsc_local_lb', JSON.stringify(localLb));
  } catch (e) {}

  try {
    await push(leaderboardRef, payload);
  } catch (err) {
    console.error("Lỗi đồng bộ Firebase:", err);
  }
}

export function subscribeLeaderboard(callback) {
  onValue(leaderboardRef, (snapshot) => {
    const data = snapshot.val();
    let rawList = [];

    if (data) {
      Object.values(data).forEach(item => {
        if (item && typeof item === 'object') {
          rawList.push({
            name: item.name || "Võ sinh ẩn danh",
            score: Number(item.score) || 0,
            time: item.time || "",
            timestamp: item.timestamp || 0
          });
        }
      });
    }

    if (rawList.length === 0) {
      try {
        rawList = JSON.parse(localStorage.getItem('fsc_local_lb') || '[]');
      } catch (e) {}
    }

    rawList.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    callback(rawList.slice(0, 20));
  }, (err) => {
    console.error("Lỗi lấy dữ liệu Realtime:", err);
  });
}

export async function resetLeaderboard(inputPassword) {
  if (inputPassword === ADMIN_PWD) {
    localStorage.removeItem('fsc_local_lb');
    try {
      await remove(leaderboardRef);
      return { success: true, message: "Đã reset Bảng Xếp Hạng thành công!" };
    } catch (err) {
      return { success: false, message: "Lỗi kết nối máy chủ!" };
    }
  } else {
    return { success: false, message: "Mật khẩu quản trị không đúng!" };
  }
}