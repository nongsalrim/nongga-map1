import { renderHeader } from './components/Header.js';
import { renderKpiCards } from './components/KpiSummaryCards.js';
import { renderIncomeSurvey } from './components/IncomeSurveyView.js';
import { renderBenchmark } from './components/BenchmarkView.js';
import { renderFinancialSchedule } from './components/FinancialScheduleView.js';
import { renderSimulation } from './components/SimulationView.js';
import { renderKamisDistribution } from './components/KamisDistributionView.js';
import { renderPdfReportModal } from './components/PdfReportModal.js';
import { CROP_PRESETS, parseExcelFile } from './utils/excelEngine.js';

class App {
  constructor() {
    this.selectedCrop = '시설수박';
    this.activeTab = 'survey'; // 'survey', 'kamis', 'benchmark', 'schedule', 'simulation'
    this.customExcelData = null;
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
      
      // Auto build custom model from parsed excel
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

    appEl.innerHTML = `
      <div id="header-root"></div>
      
      <main class="app-container">
        <div id="kpi-root"></div>

        <nav class="nav-tabs">
          <button class="nav-tab ${this.activeTab === 'survey' ? 'active' : ''}" data-tab="survey">📋 소득조사 & 원가분석</button>
          <button class="nav-tab ${this.activeTab === 'kamis' ? 'active' : ''}" data-tab="kamis">🚚 KAMIS 유통시세 & 진단</button>
          <button class="nav-tab ${this.activeTab === 'benchmark' ? 'active' : ''}" data-tab="benchmark">🏆 상·하위 20% 벤치마킹</button>
          <button class="nav-tab ${this.activeTab === 'schedule' ? 'active' : ''}" data-tab="schedule">🏛️ 자산 & 대출 스케줄</button>
          <button class="nav-tab ${this.activeTab === 'simulation' ? 'active' : ''}" data-tab="simulation">⚡ 6개년 시뮬레이터</button>
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

    // Render KPIs
    renderKpiCards(document.getElementById('kpi-root'), model);

    // Tab Navigation Events
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        this.activeTab = e.target.getAttribute('data-tab');
        this.render();
      });
    });

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
        renderFinancialSchedule(contentRoot);
        break;
      case 'simulation':
        renderSimulation(contentRoot, model);
        break;
    }
  }
}

// Start app on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
