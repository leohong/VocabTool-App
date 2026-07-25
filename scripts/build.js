const fs = require('fs');
const path = require('path');

const files = [
  'www/js/utils/textUtils.js',
  'www/js/utils/persistentStorage.js',
  'www/js/utils/dictionaryApi.js',
  'www/js/hooks/useVocabState.js',
  'www/js/components/Icons.js',
  'www/js/components/Header.js',
  'www/js/components/Dashboard.js',
  'www/js/components/Sessions.js',
  'www/js/components/AudioPlayer.js',
  'www/js/components/Modals.js',
  'www/js/components/modals/AudioSetupModal.js',
  'www/js/components/modals/PreviewModal.js',
  'www/js/components/modals/MistakeModal.js',
  'www/js/components/modals/HistoryModal.js',
  'www/js/components/modals/DictModal.js',
  'www/js/components/modals/AllPreviewModal.js',
  'www/js/components/modals/EditWordModal.js',
  'www/js/components/modals/ImportOptionsModal.js',
  'www/js/components/modals/LicensesModal.js',
  'www/js/app.js'
];

let bundleContent = '';
files.forEach(f => {
  const fullPath = path.resolve(__dirname, '..', f);
  if (fs.existsSync(fullPath)) {
    bundleContent += `\n    // ==========================================\n    // --- File: ${f} ---\n    // ==========================================\n` + fs.readFileSync(fullPath, 'utf8') + '\n';
  } else {
    console.warn(`Warning: file not found ${f}`);
  }
});

const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-TW">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>極限單字特訓系統</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>

<body class="bg-slate-900 text-slate-100 font-sans p-4 md:p-8 flex justify-center min-h-screen overscroll-none selection:bg-indigo-900 selection:text-indigo-200">

  <div id="root" class="w-full max-w-2xl flex flex-col"></div>

  <!-- 模組化編譯輸出 (Generated from www/js/ modules) -->
  <script type="text/babel">
${bundleContent}
  </script>

  <style>
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</body>

</html>
`;

const outputPath = path.resolve(__dirname, '../www/index.html');
fs.writeFileSync(outputPath, htmlTemplate);
console.log(`www/index.html generated successfully from ${files.length} modules! Total length: ${htmlTemplate.length} characters.`);
