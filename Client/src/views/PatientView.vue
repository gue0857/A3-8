<script setup>
import { ref } from 'vue';
import axios from 'axios';

// --- 狀態變數 ---
const patientText = ref('');
const result = ref(null);
const loading = ref(false);
const errorMsg = ref('');

// --- 設定後端 API 位址 ---
// 請確認你的後端 (Node.js) 是在 3000 port 運行
const API_URL = 'http://localhost:3000/api/triage/analyze';

// --- 發送分析請求 ---
const submitTriage = async () => {
  if (!patientText.value.trim()) {
    alert("請輸入您的身體狀況");
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  result.value = null;

  try {
    // 模擬病人 ID (實際專案應從登入資訊取得)
    const payload = {
      patientText: patientText.value,
      patientId: "131367607" 
    };

    const response = await axios.post(API_URL, payload);
    result.value = response.data;

    // 如果後端回傳通知醫生為 True，跳出額外提示
    if (result.value.doctor_notified) {
      alert("🚨 系統偵測到高風險！已同步發送 LINE 通知給您的主治醫師。");
    }

  } catch (err) {
    console.error(err);
    errorMsg.value = "連線失敗，請確認後端伺服器是否已啟動。";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <div class="card">
      <h1>🏥 自我健康回報 (AI Triage)</h1>
      <p class="subtitle">請用自然語言描述您現在的感覺...</p>

      <div class="input-group">
        <textarea 
          v-model="patientText" 
          placeholder="例如：我吃了藥之後頭很暈，心臟跳很快，覺得呼吸困難..."
          rows="5"
        ></textarea>
      </div>

      <button @click="submitTriage" :disabled="loading" class="submit-btn">
        {{ loading ? '🚑 AI 分析中...' : '送出評估' }}
      </button>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div v-if="result" class="result-box" :class="{ critical: result.data.urgency_score >= 8 }">
        <h3>📊 分析報告</h3>
        
        <div class="stat-row">
          <span class="label">急迫性分數 (1-10):</span>
          <span class="value score">{{ result.data.urgency_score }}</span>
        </div>

        <div class="stat-row">
          <span class="label">核心情緒:</span>
          <span class="value">{{ result.data.emotion }}</span>
        </div>

        <div class="stat-row">
          <span class="label">醫師摘要:</span>
          <p class="summary-text">{{ result.data.summary }}</p>
        </div>

        <div class="stat-row" v-if="result.fhir_reference">
          <small class="fhir-link">FHIR ID: {{ result.fhir_reference }} (已存檔)</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 簡單的樣式設計 */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.card {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

h1 { color: #2c3e50; margin-bottom: 0.5rem; text-align: center;}
.subtitle { color: #7f8c8d; text-align: center; margin-bottom: 1.5rem; }

textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  box-sizing: border-box; 
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover { background-color: #2980b9; }
.submit-btn:disabled { background-color: #bdc3c7; cursor: not-allowed; }

.error { color: #e74c3c; text-align: center; margin-top: 1rem; }

/* 結果卡片樣式 */
.result-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 5px solid #2ecc71; /* 預設綠色 (安全) */
}

/* 危險狀態樣式 */
.result-box.critical {
  background-color: #fff5f5;
  border-left: 5px solid #e74c3c; /* 紅色 (危險) */
}

.stat-row { margin-bottom: 1rem; }
.label { font-weight: bold; color: #34495e; display: block; }
.value { color: #2c3e50; }
.score { font-size: 1.5rem; font-weight: bold; color: #e67e22; }
.summary-text { background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #eee;}
.fhir-link { color: #95a5a6; font-size: 0.8rem; }
</style>