export function renderHeader(container, { selectedCrop, crops, onCropChange, onFileUpload }) {
  container.innerHTML = `
    <header class="app-header">
      <div class="brand-section">
        <div class="brand-logo">農</div>
        <div class="brand-title">
          <h1>농가살림연구소 경영분석 솔루션 (MAP1)</h1>
          <p>Agricultural Business Analysis & Automation Platform</p>
        </div>
      </div>
      
      <div class="header-controls">
        <label for="crop-selector" style="font-size:13px; font-weight:600; color:var(--text-muted);">진단 작목:</label>
        <select id="crop-selector" class="crop-select">
          ${crops.map(c => `<option value="${c}" ${c === selectedCrop ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        
        <label for="excel-uploader" class="btn-upload">
          📁 엑셀 파일 업로드
        </label>
        <input type="file" id="excel-uploader" class="file-input" accept=".xlsx, .xls" />
      </div>
    </header>
  `;

  document.getElementById('crop-selector').addEventListener('change', (e) => {
    onCropChange(e.target.value);
  });

  document.getElementById('excel-uploader').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  });
}
