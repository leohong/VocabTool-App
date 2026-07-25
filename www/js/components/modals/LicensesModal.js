// ==========================================
// --- 🪟 LicensesModal 元件 ---
// ==========================================
window.LicensesModal = ({ showLicensesModal, setShowLicensesModal }) => {
  if (!showLicensesModal) return null;

  const licenses = [
    {
      name: "VocabTool-App (極限單字特訓系統)",
      copyright: "Copyright (c) 2026 Leo Hong",
      license: "本應用程式主程式、演算法與使用者介面之版權與所有權屬原作者所有。保留所有權利。(All Rights Reserved. Proprietary Software.)"
    },
    {
      name: "Capacitor Core & Android Platform",
      copyright: "Copyright (c) 2017-present Drifty Co. d/b/a Ionic",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "Capacitor Plugins (preferences, filesystem, share)",
      copyright: "Copyright (c) 2017-present Drifty Co. d/b/a Ionic",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "Capacitor Text-to-Speech Plugin",
      copyright: "Copyright (c) 2021 Capacitor Community",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "Capgo Capacitor-Updater Plugin",
      copyright: "Copyright (c) 2022 Capgo",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "React & React DOM",
      copyright: "Copyright (c) Meta Platforms, Inc. and affiliates.",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "Tailwind CSS",
      copyright: "Copyright (c) Tailwind Labs, Inc.",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
      name: "Babel Standalone",
      copyright: "Copyright (c) 2014-present Sebastian McKenzie and other contributors",
      license: `MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <h3 className="font-black text-indigo-400 text-sm tracking-wide">開源軟體授權宣告</h3>
          <button 
            onClick={() => setShowLicensesModal(false)}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300">
          <p className="text-xs text-slate-400 leading-relaxed">
            本應用程式之實作使用了以下第三方開源組件。依據各組件之授權條款，特此羅列其版權聲明與授權文件，以符法規：
          </p>
          {licenses.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-left">
              <h4 className="font-bold text-indigo-300 text-xs">{item.name}</h4>
              <p className="text-[10px] text-slate-500 italic">{item.copyright}</p>
              <pre className="text-[9px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg overflow-x-auto max-h-24 whitespace-pre-wrap font-mono leading-normal border border-slate-800">
                {item.license}
              </pre>
            </div>
          ))}
        </div>
        <div className="px-6 py-3.5 border-t border-slate-800/80 flex justify-end bg-slate-950/20">
          <button 
            onClick={() => setShowLicensesModal(false)}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-xl transition-colors"
          >
            確認關閉
          </button>
        </div>
      </div>
    </div>
  );
};
