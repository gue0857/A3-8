<script setup>
import { ref } from 'vue';
import axios from 'axios';

const patientId = ref('82'); // 預設帶入測試 ID
const cards = ref([]);
const loading = ref(false);

// 模擬 EHR 呼叫 Hook 的行為
const openPatientRecord = async () => {
  loading.value = true;
  cards.value = [];

  // 這是標準 CDS Hook 的 Request 格式
  const hookRequest = {
    hook: "patient-view",
    hookInstance: "uuid-random-123",
    fhirServer: "http://hapi.fhir.org/baseR4",
    context: {
      userId: "Practitioner/doctor-01",
      patientId: patientId.value, // 重點是這個 ID
      encounterId: "enc-123"
    }
  };

  try {
    // 呼叫你的後端 CDS Service
    const response = await axios.post('http://localhost:3000/cds-services/patient-triage-check', hookRequest);
    cards.value = response.data.cards;
    
    if(cards.value.length === 0) {
        alert("該病人目前沒有相關的 AI 警示卡片");
    }

  } catch (error) {
    console.error("CDS Hook 呼叫失敗", error);
    alert("無法連接 CDS Service");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="ehr-container">
    <div class="ehr-header">
      <h2>👨‍⚕️ 醫師診間系統 (EHR Simulator)</h2>
      <div class="search-bar">
        <label>開啟病歷 (Patient ID): </label>
        <input v-model="patientId" type="text" />
        <button @click="openPatientRecord" :disabled="loading">
          {{ loading ? '載入中...' : '開啟病歷' }}
        </button>
      </div>
    </div>

    <div class="ehr-content">
      <div class="patient-info">
        <h3>基本資料</h3>
        <p>姓名: 王大明 (範例)</p>
        <p>年齡: 45歲</p>
        <p>性別: 男</p>
        <hr>
        <p>這裡顯示傳統的病歷資料、抽血報告等...</p>
      </div>

      <div v-if="cards.length > 0" class="cds-cards-container">
        <div 
          v-for="(card, index) in cards" 
          :key="index" 
          class="cds-card"
          :class="card.indicator"
        >
          <div class="card-header">
            <span class="indicator-icon">
                {{ card.indicator === 'critical' ? '🔴' : (card.indicator === 'warning' ? '🟡' : '🔵') }}
            </span>
            <span class="card-summary">{{ card.summary }}</span>
          </div>
          <div class="card-body">
            <pre>{{ card.detail }}</pre>
          </div>
          <div class="card-footer" v-if="card.links">
            <a v-for="link in card.links" :key="link.label" :href="link.url" target="_blank">
              {{ link.label }} &rarr;
            </a>
          </div>
          <div class="card-source">Source: {{ card.source.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ehr-container {
  max-width: 900px;
  margin: 2rem auto;
  border: 1px solid #ccc;
  background: #f4f4f4;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.ehr-header {
  background: #333;
  color: #fff;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ehr-content {
  display: flex;
  flex: 1;
  padding: 1rem;
  gap: 1rem;
}

.patient-info {
  flex: 2;
  background: #fff;
  padding: 1rem;
  border: 1px solid #ddd;
}

/* CDS Card Styles - 模仿真實 EHR 的卡片樣式 */
.cds-cards-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cds-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.card-header {
  padding: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  padding: 10px;
  font-size: 0.9rem;
  white-space: pre-wrap; /* 讓換行符號生效 */
}

.card-footer {
  padding: 10px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
}

.card-source {
  font-size: 0.7rem;
  color: #999;
  padding: 5px 10px;
  text-align: right;
}

/* 顏色主題 */
.cds-card.critical { border-left: 5px solid #d32f2f; }
.cds-card.critical .card-header { background-color: #ffebee; color: #d32f2f; }

.cds-card.warning { border-left: 5px solid #fbc02d; }
.cds-card.warning .card-header { background-color: #fffde7; color: #f57f17; }

.cds-card.info { border-left: 5px solid #1976d2; }
.cds-card.info .card-header { background-color: #e3f2fd; color: #1976d2; }

@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>