<template>
  <div class="ehr-container">
    <header class="ehr-header">
      <div class="header-content">
        <h1>🩺 醫師看診視圖 (EHR Dashboard)</h1>
        <p>臨床決策支援系統 (CDS Hooks) 整合展示</p>
      </div>
    </header>

    <main class="ehr-main">
      <section class="card-box search-section">
        <label for="patientIdInput" class="search-label">輸入病患 ID 進行看診：</label>
        <div class="search-bar">
          <input 
            id="patientIdInput" 
            v-model="patientId" 
            type="text" 
            placeholder="請輸入病患 ID (例如: 82)"
            @keyup.enter="openPatientRecord"
          />
          <button @click="openPatientRecord" :disabled="loading" class="btn-primary">
            <span v-if="loading" class="spinner"></span>
            <span v-else>開啟紀錄</span>
          </button>
        </div>
      </section>

      <transition name="fade">
        <section v-if="patientInfo" class="card-box patient-info-section">
          <div class="patient-header">
            <div class="avatar">
              {{ getPatientInitials(patientInfo) }}
            </div>
            <div class="info-details">
              <h2>{{ getPatientName(patientInfo) }}</h2>
              <div class="tags">
                <span class="tag">🚻 {{ translateGender(patientInfo.gender) }}</span>
                <span class="tag">🎂 生日: {{ patientInfo.birthDate || '無紀錄' }}</span>
                <span class="tag">🆔 ID: {{ patientInfo.id }}</span>
              </div>
            </div>
          </div>
        </section>
      </transition>

      <transition name="fade">
        <section v-if="cards.length > 0" class="cds-cards-section">
          <h3 class="section-title">💡 AI 臨床分診建議</h3>
          <div class="cards-grid">
            <div 
              v-for="(card, index) in cards" 
              :key="index" 
              :class="['cds-card', `indicator-${card.indicator}`]"
            >
              <div class="card-indicator-bar"></div>
              
              <div class="card-content">
                <div class="card-header">
                  <h4>{{ card.summary }}</h4>
                  <span class="indicator-badge">{{ card.indicator }}</span>
                </div>
                <p class="card-detail">{{ card.detail }}</p>
                <div class="card-footer">
                  <small class="source-label">
                    🤖 來源：{{ card.source.label }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

// 狀態變數
const patientId = ref('82');
const patientInfo = ref(null);
const cards = ref([]);
const loading = ref(false);

// 輔助函數：取得病患名字
const getPatientName = (patient) => {
  if (patient?.name && patient.name.length > 0) {
    const nameData = patient.name[0];
    return nameData.text || `${nameData.family || ''} ${nameData.given?.join(' ') || ''}`.trim();
  }
  return '未知姓名';
};

// 輔助函數：取得名字首字 (做為頭像)
const getPatientInitials = (patient) => {
  const name = getPatientName(patient);
  return name.charAt(0).toUpperCase();
};

// 輔助函數：翻譯性別
const translateGender = (gender) => {
  if (gender === 'male') return '男性';
  if (gender === 'female') return '女性';
  return '未知';
};

// 主要執行動作
const openPatientRecord = async () => {
  if (!patientId.value) return;
  
  loading.value = true;
  patientInfo.value = null;
  cards.value = [];

  try {
    console.log(`[EHR模擬] 正在查詢病患 ${patientId.value} 的資料...`);
    
    // 1. 真實抓取 FHIR 病患資料
    const fhirBaseUrl = 'https://hapi.fhir.tw/fhir'; 
    const patientResponse = await axios.get(`${fhirBaseUrl}/Patient/${patientId.value}`);
    patientInfo.value = patientResponse.data; 

    // 2. 向後端請求 CDS Discovery 菜單
    const cdsBaseUrl = 'http://localhost:3000/cds-services';
    const discoveryResponse = await axios.get(cdsBaseUrl);
    const services = discoveryResponse.data.services;
    
    const targetService = services.find(s => s.id === 'patient-triage-service');
    if (!targetService) throw new Error("找不到對應的 CDS 服務！");

    // 3. 觸發 CDS Hook
    const serviceEndpointUrl = `${cdsBaseUrl}/${targetService.id}`;
    const hookResponse = await axios.post(serviceEndpointUrl, {
      hook: targetService.hook, 
      hookInstance: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      context: { userId: "Practitioner/123", patientId: patientId.value },
      prefetch: { patient: patientInfo.value }
    });

    cards.value = hookResponse.data.cards;

  } catch (error) {
    console.error("流程發生錯誤:", error);
    if (error.response?.status === 404) {
      alert("在 FHIR 伺服器上找不到此病患 ID");
    } else {
      alert("連線失敗，請確認 FHIR Server 與後端皆已啟動。");
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 全局變數 */
.ehr-container {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-color: #f3f4f6;
  --card-bg: #ffffff;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --info-color: #3b82f6;
  --warning-color: #f59e0b;
  --critical-color: #ef4444;

  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  min-height: 100vh;
  padding-bottom: 40px;
}

/* 標題區塊 */
.ehr-header {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  padding: 40px 20px 60px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 1px;
}

.header-content p {
  margin: 8px 0 0;
  opacity: 0.85;
  font-size: 16px;
}

/* 主體佈局 */
.ehr-main {
  max-width: 800px;
  margin: -30px auto 0;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 共用卡片樣式 */
.card-box {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
}

/* 搜尋區塊 */
.search-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-main);
  font-size: 16px;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.search-bar input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
}

.search-bar input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading 圈圈 */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* 病患資料區塊 */
.patient-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.info-details h2 {
  margin: 0 0 10px 0;
  color: var(--text-main);
  font-size: 22px;
}

.tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag {
  background-color: #f3f4f6;
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

/* CDS Cards 區塊 */
.section-title {
  margin: 10px 0 16px;
  color: var(--text-main);
  font-size: 20px;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cds-card {
  display: flex;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f3f4f6;
}

.cds-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

/* 卡片緊急程度顏色條 */
.card-indicator-bar {
  width: 8px;
  flex-shrink: 0;
}
.indicator-info .card-indicator-bar { background-color: var(--info-color); }
.indicator-warning .card-indicator-bar { background-color: var(--warning-color); }
.indicator-critical .card-indicator-bar { background-color: var(--critical-color); }

.card-content {
  padding: 20px;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h4 {
  margin: 0;
  font-size: 18px;
  color: var(--text-main);
  line-height: 1.4;
}

/* 卡片徽章 */
.indicator-badge {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.indicator-info .indicator-badge { background: #eff6ff; color: var(--info-color); }
.indicator-warning .indicator-badge { background: #fffbeb; color: var(--warning-color); border: 1px solid #fef3c7; }
.indicator-critical .indicator-badge { background: #fef2f2; color: var(--critical-color); border: 1px solid #fee2e2; }

.card-detail {
  color: var(--text-muted);
  margin: 0 0 16px 0;
  line-height: 1.6;
  font-size: 15px;
}

.card-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

.source-label {
  color: #9ca3af;
  font-weight: 500;
  font-size: 13px;
}

/* Vue 轉場動畫 */
.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s ease, transform 0.4s ease; 
}
.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
  transform: translateY(-10px); 
}
</style>