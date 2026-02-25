// routes/triage.js
const express = require('express');
const router = express.Router();
const { analyzePatientFeedback } = require('../services/aiService');
const { saveToFHIR } = require('../services/fhirService');
const { sendDoctorAlert } = require('../services/lineService');

// POST /api/triage/analyze
router.post('/analyze', async (req, res) => {
    const { patientText, patientId } = req.body;

    if (!patientText) {
        return res.status(400).json({ error: "請輸入內容" });
    }

    console.log(`\n--- 收到病人 (${patientId}) 回饋 ---`);

    // 1. AI 分析
    const aiResult = await analyzePatientFeedback(patientText);
    console.log("AI 分析結果:", aiResult);

    // 2. 存入 FHIR
    const fhirId = await saveToFHIR(aiResult, patientId || "Unknown");

    // 3. 判斷是否需要通知醫生 (分數 >= 10 或 需要介入)
    let alertSent = false;
    if (aiResult.urgency_score >= 10 || aiResult.needs_human_intervention) {
        await sendDoctorAlert(aiResult, fhirId);
        alertSent = true;
    }

    // 4. 回傳給前端
    res.json({
        success: true,
        data: aiResult,
        fhir_reference: fhirId,
        doctor_notified: alertSent
    });
});

module.exports = router;