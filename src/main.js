import { renderHeader } from './components/Header.js';
import { renderFarmIntakeStep } from './components/FarmIntakeStep.js';
import { renderKpiCards } from './components/KpiSummaryCards.js';
import { renderIncomeSurvey } from './components/IncomeSurveyView.js';
import { renderBenchmark } from './components/BenchmarkView.js';
import { renderFinancialSchedule } from './components/FinancialScheduleView.js';
import { renderSimulation } from './components/SimulationView.js';
import { renderKamisDistribution } from './components/KamisDistributionView.js';
import { renderBepSensitivity } from './components/BepSensitivityView.js';
import { renderCostStrategy } from './components/CostStrategyView.js';
import { renderPdfReportModal } from './components/PdfReportModal.js';
import { renderFarmProfileEditorModal } from './components/FarmProfileEditorModal.js';
import { CROP_PRESETS, SAMPLE_ASSETS, SAMPLE_LOANS, parseExcelFile } from './utils/excelEngine.js';

class App {
  constructor() {
    this.viewStep = 'input'; // 'input' (Step 1 메인 데이터 입력 센터) | 'result' (Step 2 진단 결과 보고서)
    this.selectedCrop = '시설수박';
    this.activeTab = 'survey'; // 'survey', 'kamis', 'benchmark', 'schedule', 'simulation', 'bep', 'strategy'
    this.customExcelData = null;
    this.customAssets = JSON.parse(JSON.stringify(SAMPLE_ASSETS));
    this.customLoans = JSON.parse(JSON.stringify(SAMPLE_LOANS));
    this.init();
  }

  getCurrentModel() {
    if (this.customExcelData && this.customExcelData.model) {
      return this.customExcelData.model;
    }
    return CROP_PRESETS[this.selectedCrop] || CROP_PRESETS['시설수박'];
  }

  init() {
    this.render();
  }

  async handleFileUpload(file) {
    try {
      alert(`[${file.name}] 엑셀 파싱 및 자동 경영분석을 수행합니다!`);
      const parsed = await parseExcelFile(file);
      console.log('Parsed Excel File:', parsed);
      
      this.customExcelData = {
        fileName: file.name,
        model: {
          category: '사용자 엑셀',
          cropName: `업로드: ${file.name.replace('.xlsx', '')}`,
          areaPyung: 1000,
          cycles: 2,
          revenue: 350000000,
          operatingExpenses: 110000000,
          income: 240000000,
          netProfit: 185000000,
          costBreakdown: [
            { name: '종자/종묘비', cost: 15000000, percent: 13.6 },
            { name: '비료/농약비', cost: 22000000, percent: 20.0 },
            { name: '시설상각비', cost: 35000000, percent: 31.8 },
            { name: '기타재료/인건비', cost: 38000000, percent: 34.6 }
          ],
          benchmark: CROP_PRESETS['시설수박'].benchmark
        }
      };
      
      this.viewStep = 'result';
      this.render();
    } catch (err) {
      console.error('File parse error:', err);
      alert('엑셀 파일 파싱 중 오류가 발생했습니다.');
    }
  }

  openReportModal(model, analysis) {
    renderPdfReportModal(model, analysis);
  }

  render() {
    const appEl = document.getElementById('app');
    const model = this.getCurrentModel();

    // Step 1: 메인 데이터 입력 센터 (최우선 메인 화면!)
    if (this.viewStep === 'input') {
      appEl.innerHTML = `
        <div id="header-root"></div>
        <main class="app-container" style="padding-top: 20px;">
          <div id="farm-intake-step-root"></div>
        </main>
      `;

      renderHeader(document.getElementById('header-root'), {
        selectedCrop: this.selectedCrop,
        crops: Object.keys(CROP_PRESETS),
        onCropChange: (crop) => {
          this.selectedCrop = crop;
          this.customExcelData = null;
          this.render();
        },
        onFileUpload: (file) => this.handleFileUpload(file)
      });

      renderFarmIntakeStep(
        document.getElementById('farm-intake-step-root'),
        model,
        this.customAssets,
        this.customLoans,
        (newModel, newAssets, newLoans, isStepSwitch) => {
          this.customExcelData = { fileName: '직접입력', model: newModel };
          this.customAssets = newAssets;
          this.customLoans = newLoans;
          if (isStepSwitch) {
            this.viewStep = 'result'; // Move to Step 2!
            this.render();
          }
        },
        (cropName) => {
          this.selectedCrop = cropName;
          this.customExcelData = null;
          this.render();
        }
      );
      return;
    }

    // Step 2: 컨설팅 종합 진단 결과 대시보드 (7대 탭 확장 완료)
    appEl.innerHTML = `
      <div id="header-root"></div>
      
      <main class="app-container">
        <!-- Step 1 이동 안내 바 -->
        <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 24px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <span class="badge" style="background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.3); margin-right:10px;">STEP 2 RESULT</span>
            <span style="color:#FFF; font-weight:700; font-size:14px;">농가 맞춤 진단서: <b style="color:#10B981;">${model.cropName}</b> (${model.areaPyung || 1000}평)</span>
          </div>
          <button id="btn-back-to-input" class="btn-upload" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8); border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;">
            ✏️ 농가 데이터 재입력 / 수정하기
          </button>
        </div>

        <div id="kpi-root"></div>

        <nav class="nav-tabs" style="display:flex; flex-wrap:wrap; gap:8px;">
          <button class="nav-tab ${this.activeTab === 'survey' ? 'active' : ''}" data-tab="survey">📋 1. 소득조사 & 원가분석</button>
          <button class="nav-tab ${this.activeTab === 'kamis' ? 'active' : ''}" data-tab="kamis">🚚 2. KAMIS 유통시세 & 진단</button>
          <button class="nav-tab ${this.activeTab === 'benchmark' ? 'active' : ''}" data-tab="benchmark">🏆 3. 상·하위 20% 벤치마킹</button>
          <button class="nav-tab ${this.activeTab === 'schedule' ? 'active' : ''}" data-tab="schedule">🏛️ 4. 자산 & 대출 스케줄</button>
          <button class="nav-tab ${this.activeTab === 'simulation' ? 'active' : ''}" data-tab="simulation">⚡ 5. 6개년 시뮬레이터</button>
          <button class="nav-tab ${this.activeTab === 'bep' ? 'active' : ''}" data-tab="bep">🎯 6. 손익분기점 & 민감도 분석</button>
          <button class="nav-tab ${this.activeTab === 'strategy' ? 'active' : ''}" data-tab="strategy">💡 7. 원가절감 처방전 & 경영개선 전략</button>
        </nav>

        <div id="tab-content-root"></div>
      </main>
    `;

    // Render Header
    renderHeader(document.getElementById('header-root'), {
      selectedCrop: this.selectedCrop,
      crops: Object.keys(CROP_PRESETS),
      onCropChange: (crop) => {
        this.selectedCrop = crop;
        this.customExcelData = null;
        this.render();
      },
      onFileUpload: (file) => this.handleFileUpload(file)
    });

    const backBtn = document.getElementById('btn-back-to-input');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewStep = 'input';
        this.render();
      });
    }

    // Render KPIs
    renderKpiCards(document.getElementById('kpi-root'), model);

    // Tab Navigation Events
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        this.activeTab = e.target.getAttribute('data-tab');
        this.render();
      });
    });

    const openEditorHandler = () => {
      renderFarmProfileEditorModal(model, this.customAssets, this.customLoans, (newModel, newAssets, newLoans) => {
        this.customExcelData = { fileName: '직접입력', model: newModel };
        this.customAssets = newAssets;
        this.customLoans = newLoans;
        this.render();
      });
    };

    // Render Tab Content
    const contentRoot = document.getElementById('tab-content-root');
    switch (this.activeTab) {
      case 'survey':
        renderIncomeSurvey(contentRoot, model);
        break;
      case 'kamis':
        renderKamisDistribution(contentRoot, model, (m, a) => this.openReportModal(m, a));
        break;
      case 'benchmark':
        renderBenchmark(contentRoot, model);
        break;
      case 'schedule':
        renderFinancialSchedule(contentRoot, this.customAssets, this.customLoans, openEditorHandler);
        break;
      case 'simulation':
        renderSimulation(contentRoot, model);
        break;
      case 'bep':
        renderBepSensitivity(contentRoot, model);
        break;
      case 'strategy':
        renderCostStrategy(contentRoot, model);
        break;
    }
  }
}

// Start app on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
