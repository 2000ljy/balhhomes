// =================================================================
// 🚀 站长必读：如何实现全网数据同步？
// =================================================================
// 1. 访问 https://console.firebase.google.com/ 创建一个免费项目。
// 2. 进入项目设置 -> 常规 -> 下方的 "SDK setup and configuration"。
// 3. 选择 "Web" (</> 图标) 创建应用。
// 4. 将生成的配置信息复制并覆盖下方的 "YOUR_..." 占位符。
// 5. 确保在 Firebase 控制台 -> Build -> Firestore Database 中创建了数据库（选择以测试模式启动）。
// =================================================================

export const FIREBASE_CONFIG = {
  // 👇 请将您的真实信息填入引号中 👇
  apiKey: "AIzaSyDW6G035q488qhrmH5tJQHAYpiYSNdmCls",
  authDomain: "project-794979115064563424.firebaseapp.com",
  projectId: "project-794979115064563424",
  storageBucket: "project-794979115064563424.firebasestorage.app",
  messagingSenderId: "540700110417",
  appId: "1:540700110417:web:7f636d89e4ae5a5ba35270",
  measurementId: "G-1HE01MZ31K"
};

// 系统会自动检测您是否已填入配置
export const isConfigured = () => {
  // 只要您修改了 projectId，系统就认为已配置
  return FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID";
};