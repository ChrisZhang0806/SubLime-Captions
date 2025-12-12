import React, { useState, useRef, useEffect } from 'react';
import { SubtitleCue, ContextInfo, AppStatus, ProcessingStats } from './types';
import { parseSRT, buildSRT, hasChanged } from './utils/subtitleParser';
import { fixSubtitlesWithGemini } from './services/geminiService';
import { UploadIcon, CheckIcon, ArrowLeftIcon, XMarkIcon, LogoIcon, GlobeIcon, SunIcon, MoonIcon, ComputerIcon, DownloadIcon, PencilIcon, ExpandIcon, CollapseIcon, UndoIcon, LinkedInIcon, NingLogoIcon } from './components/Icons';

type Theme = 'light' | 'dark' | 'system';
type Lang = 'en' | 'zh';
type FilterType = 'all' | 'modified' | 'unmodified';

const translations = {
  en: {
    appName: "SubLime Captions",
    heroTitle: "Context-Aware Subtitle Correction",
    heroHighlight: "Powered by Gemini",
    heroSubtitle: "Automatically detect and fix text errors by analyzing the subtitle's context and your provided reference information.",
    contextTitle: "Correction Setup",
    contextDesc: "Provide context to improve accuracy, or specify rules to control the AI's editing behavior.",
    descriptionLabel: "Context & Custom Rules",
    descriptionPlaceholder: "Describe the content (e.g., 'Tech Interview') or add specific rules (e.g., 'Do not fix punctuation', 'Keep filler words“aha”').",
    keywordsLabel: "Key Names & Terms",
    keywordsPlaceholder: "e.g. Algonquin College, Ottawa, React, TypeScript",
    keywordsHint: "Help AI recognize proper nouns, characters, or jargon.",
    referenceUrlLabel: "Reference URL",
    referenceUrlPlaceholder: "https://en.wikipedia.org/wiki/Algonquin_College",
    fetchBtn: "Analyze Link",
    fetching: "Analyzing...",
    fetchError: "Please enter a URL.",
    fetchInvalid: "Invalid URL format. Please include http:// or https://",
    snapshotTitle: "Website Snapshot",
    verified: "Content Analyzed",
    cleaningTitle: "Cleaning Options",
    optFillers: "Remove Filler Words (um, ah, like)",
    optStutters: "Fix Stutters (I... I went)",
    optProfanity: "Filter Profanity",
    dropTitle: "Drop your .srt file here",
    dropDesc: "or click to browse",
    parsed: "lines parsed",
    removeFile: "Replace",
    magicBtn: "Start AI Correction",
    processingTitle: "SubLime is optimizing your captions...",
    processingDesc: "Applying context awareness and your glossary terms to detect errors and refine terminology.",
    cancelProcessing: "Stop & Back",
    completeTitle: "Correction Complete",
    statTotal: "Total Lines",
    statCorrections: "Corrections Found",
    btnSelectAll: "Select All",
    btnConfirm: "Confirm",
    btnDiscard: "Discard",
    btnBatchConfirm: "Confirm",
    btnBatchDiscard: "Discard",
    chkShowAll: "Show all lines",
    btnDownload: "Download SRT",
    btnStop: "Stop",
    noChanges: "No changes found.",
    viewAll: "View all lines",
    btnNewFile: "Start Over",
    editBtn: "Edit",
    saveBtn: "Save",
    cancelBtn: "Cancel",
    okBtn: "OK",
    xBtn: "X",
    footer: "© " + new Date().getFullYear() + " Ning Zhang. All rights reserved.",
    selectItemsPrompt: "Select items to batch action",
    deleted: "(Deleted)",
    errorLabel: "Error:",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    realtimeTitle: "Real-time Updates",
    revertBtn: "Revert",
    filterAll: "All",
    filterModified: "Modified",
    filterUnmodified: "Unmodified",
    actionEdit: "Edit",
    actionRestore: "Restore",
    realtimeFilterAll: "All",
    realtimeFilterModified: "Modified",
    realtimeFilterUnmodified: "Unmodified",
    newFile: "Start Over",
    stopAndBack: "Cancel & Return",
    discardChangesTitle: "Please confirm you have downloaded the SRT before leaving.",
    discardChangesMsg: "Are you sure you want to start over?",
    cancel: "Cancel",
    confirmDiscard: "Start Over",
    batchDiscard: "Discard",
    selected: "selected",
    unselect: "Unselect",
    expand: "Focus Mode",
    collapse: "Exit Focus",
    processingStatus: "Processing...",
    modelLabel: "AI Model",
    modelDesc: "Select the intelligence level for correction",
    modelFlash: "Fast & efficient",
    modelPro: "Best for complex context"
  },
  zh: {
    appName: "SubLime Captions",
    heroTitle: "基于语境的智能字幕优化",
    heroHighlight: "Powered by Gemini",
    heroSubtitle: "通过分析视频上下文与您提供的参考信息，自动查找并精准修正字幕中的文本错误。",
    contextTitle: "优化设置",
    contextDesc: "提供背景信息以提高准确性，或指定规则来控制 AI 的编辑行为。",
    descriptionLabel: "视频背景与自定义规则",
    descriptionPlaceholder: "描述视频内容（如：科技访谈），或输入具体修改指令（如：'不修改标点'，'保留语气词“哎呀”'）。",
    keywordsLabel: "关键名称与术语",
    keywordsPlaceholder: "例如：亚岗昆学院, 渥太华, React, TypeScript",
    keywordsHint: "帮助 AI 识别专有名词、角色名或行话。",
    referenceUrlLabel: "参考链接",
    referenceUrlPlaceholder: "https://zh.wikipedia.org/wiki/亚岗昆学院",
    fetchBtn: "解析链接",
    fetching: "解析中...",
    fetchError: "请输入网址。",
    fetchInvalid: "网址格式无效。请包含 http:// 或 https://",
    snapshotTitle: "网页快照",
    verified: "内容已解析",
    cleaningTitle: "清理选项",
    optFillers: "去除语气词 (嗯, 啊, 那个, 呃, 哈)",
    optStutters: "修正口吃/重复 (我...我去)",
    optProfanity: "过滤脏话",
    dropTitle: "拖拽 .srt 文件到这里",
    dropDesc: "或点击浏览",
    parsed: "行已解析",
    removeFile: "替换文件",
    magicBtn: "开始智能优化",
    processingTitle: "SubLime 正在优化您的字幕...",
    processingDesc: "正在结合视频语境与您的优化指令，智能识别错误并修正词汇。",
    cancelProcessing: "停止并返回",
    completeTitle: "优化完成",
    statTotal: "总行数",
    statCorrections: "已优化行数",
    btnSelectAll: "全选",
    btnConfirm: "确认",
    btnDiscard: "放弃",
    btnBatchConfirm: "批量确认",
    btnBatchDiscard: "批量放弃",
    chkShowAll: "显示所有行",
    btnDownload: "下载 SRT",
    btnStop: "停止",
    noChanges: "未发现修改。",
    viewAll: "查看所有行",
    btnNewFile: "开始新任务",
    editBtn: "编辑",
    saveBtn: "保存",
    cancelBtn: "取消",
    okBtn: "确认",
    xBtn: "放弃",
    footer: "© " + new Date().getFullYear() + " Ning Zhang. All rights reserved.",
    selectItemsPrompt: "Select items to batch action",
    deleted: "(Deleted)",
    errorLabel: "Error:",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    realtimeTitle: "实时预览",
    revertBtn: "撤销修改",
    filterAll: "全部",
    filterModified: "已修改",
    filterUnmodified: "未修改",
    actionEdit: "修改",
    actionRestore: "还原",
    realtimeFilterAll: "全部",
    realtimeFilterModified: "已修改",
    realtimeFilterUnmodified: "未修改",
    newFile: "开始新任务",
    stopAndBack: "取消并返回",
    discardChangesTitle: "离开前请确认是否已下载字幕",
    discardChangesMsg: "确定要开始新任务吗？",
    cancel: "取消",
    confirmDiscard: "重新开始",
    batchDiscard: "放弃修改",
    selected: "已选择",
    unselect: "取消选择",
    expand: "专注模式",
    collapse: "退出专注",
    processingStatus: "优化中...",
    modelLabel: "AI 模型",
    modelDesc: "选择适合任务的智能模型",
    modelFlash: "快速高效",
    modelPro: "适合复杂语境"
  }
};

const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
];

const App: React.FC = () => {
  // --- State ---
  const [theme, setTheme] = useState<Theme>('system');
  const [lang, setLang] = useState<Lang>('en'); // Default language
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [context, setContext] = useState<ContextInfo>({
    projectContext: '',
    glossaryTerms: '',
    referenceUrl: '',
    referenceUrlContent: '',
    removeFillers: false,
    fixStutters: false,
    filterProfanity: false
  });
  
  // UI State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Model Selector State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  
  // Theme Menu State
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // URL Fetching State
  const [urlStatus, setUrlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [urlPreviewTitle, setUrlPreviewTitle] = useState<string>('');

  const [progress, setProgress] = useState<number>(0);
  const [stats, setStats] = useState<ProcessingStats>({ totalLines: 0, processedLines: 0, correctedCount: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Processing Control
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedLinesRef = useRef<string[]>([]);
  const realtimeOverridesRef = useRef<Record<number, string>>({});

  // Review & Edit State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<FilterType>('all');
  
  // Realtime Processing State
  const [realtimeCues, setRealtimeCues] = useState<SubtitleCue[]>([]);
  const [realtimeFilter, setRealtimeFilter] = useState<FilterType>('all');
  const [editingRealtimeId, setEditingRealtimeId] = useState<number | null>(null);
  const [realtimeEditText, setRealtimeEditText] = useState<string>('');

  // --- Effects ---
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Developer Easter Egg
  useEffect(() => {
    console.log(
      `%c
   _____       _     _      _                  
  / ____|     | |   | |    (_)                 
 | (___  _   _| |__ | |     _ _ __ ___   ___   
  \\___ \\| | | | '_ \\| |    | | '_ \` _ \\ / _ \\  
  ____) | |_| | |_) | |____| | | | | | |  __/  
 |_____/ \\__,_|_.__/|______|_|_| |_| |_|\\___|  
                                               
  🍋 Freshly coded by Ning Zhang
      `,
      'color: #84cc16; font-weight: bold; font-family: monospace; font-size: 12px;'
    );
  }, []);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [themeMenuRef, modelMenuRef]);
  
  // --- Handlers ---

  const handleToggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus(AppStatus.PARSING);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedCues = parseSRT(content);
        if (parsedCues.length === 0) {
          throw new Error("No valid subtitles found. Please check the file format.");
        }
        setCues(parsedCues);
        setStatus(AppStatus.IDLE); // Back to IDLE but with data loaded
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to parse file");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error reading file");
      setStatus(AppStatus.ERROR);
    };
    reader.readAsText(file);
    // Reset value to ensure onChange fires even if the same file is selected again
    event.target.value = '';
  };

  const parseHtml = (html: string, baseUrl: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.title || baseUrl;
    doc.querySelectorAll('script, style, noscript, iframe, svg, img, nav, footer, header, form, aside').forEach(s => s.remove());
    
    const textContent = doc.body.textContent || "";
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    return { title, content: cleanText };
  };

  const isBlockedContent = (content: string) => {
    const lower = content.toLowerCase();
    return lower.includes("please set a user-agent") || 
           lower.includes("robot policy") || 
           lower.includes("access denied") ||
           lower.includes("security check") ||
           lower.includes("please enable cookies");
  };

  const handleUrlFetch = async () => {
    const urlStr = context.referenceUrl.trim();
    if (!urlStr) {
      setUrlStatus('error');
      setErrorMsg(t.fetchError);
      return;
    }
    let urlObj: URL;
    try { urlObj = new URL(urlStr); } catch (_) { setUrlStatus('error'); setErrorMsg(t.fetchInvalid); return; }

    setUrlStatus('loading');
    setErrorMsg(null);
    let fetchedHtml = '';
    let success = false;
    let finalTitle = '';

    if (urlObj.hostname.includes('wikipedia.org')) {
      try {
        const pathParts = urlObj.pathname.split('/');
        const titleIndex = pathParts.indexOf('wiki');
        if (titleIndex !== -1 && titleIndex + 1 < pathParts.length) {
            const pageTitle = pathParts[titleIndex + 1];
            const apiUrl = `https://${urlObj.hostname}/api/rest_v1/page/html/${pageTitle}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
              fetchedHtml = await response.text();
              success = true;
              finalTitle = "Wikipedia: " + decodeURIComponent(pageTitle).replace(/_/g, ' ');
            }
        }
      } catch (e) { console.warn("Wikipedia API failed:", e); }
    }
    if (!success) {
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(urlStr)}`);
            if (response.ok) {
                const text = await response.text();
                if (!isBlockedContent(text)) { fetchedHtml = text; success = true; }
            }
        } catch (e) { console.warn("CorsProxy failed", e); }
    }
    if (!success) {
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlStr)}&disableCache=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.contents && !isBlockedContent(data.contents)) { fetchedHtml = data.contents; success = true; }
        }
      } catch (e) { console.warn("AllOrigins proxy failed:", e); }
    }
    if (!success) {
      try {
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlStr)}`);
        if (response.ok) {
          const text = await response.text();
           if (!isBlockedContent(text)) { fetchedHtml = text; success = true; }
        }
      } catch (e) { console.warn("CodeTabs proxy failed:", e); }
    }
    if (!success || !fetchedHtml) {
      setUrlStatus('error');
      setErrorMsg("Failed to fetch content. The website is blocking access or proxies are unavailable.");
      return;
    }
    try {
      const { title, content } = parseHtml(fetchedHtml, urlStr);
      if (content.length < 50) throw new Error("Could not extract enough readable text from this website.");
      setContext(prev => ({ ...prev, referenceUrlContent: content }));
      setUrlPreviewTitle(finalTitle || title);
      setUrlStatus('success');
    } catch (err: any) {
      console.error(err);
      setUrlStatus('error');
      setErrorMsg(`Error parsing website: ${err.message || "Unknown error"}`);
    }
  };

  const handleClearUrl = () => {
    setContext(prev => ({ ...prev, referenceUrl: '', referenceUrlContent: '' }));
    setUrlStatus('idle');
    setUrlPreviewTitle('');
    setErrorMsg(null);
  };

  const updateRealtimeCues = () => {
    if (!processedLinesRef.current) return;
    const currentLines = processedLinesRef.current;
    const newCues = currentLines.map((text, idx) => {
         const override = realtimeOverridesRef.current[idx];
         const displayText = override !== undefined ? override : text;
         if (!cues[idx]) return null;
         return {
             ...cues[idx],
             text: displayText,
             originalText: cues[idx].text,
             isConfirmed: false
         };
    }).filter(c => c !== null) as SubtitleCue[];
    setRealtimeCues(newCues);
  };

  const handleRealtimeEditStart = (cue: SubtitleCue) => {
    setEditingRealtimeId(cue.id);
    setRealtimeEditText(cue.text);
  };

  const handleRealtimeEditSave = (idx: number) => {
      realtimeOverridesRef.current[idx] = realtimeEditText;
      setEditingRealtimeId(null);
      setRealtimeEditText('');
      updateRealtimeCues();
  };

  const handleRealtimeDiscard = (idx: number) => {
      const original = cues[idx].text; 
      realtimeOverridesRef.current[idx] = original;
      updateRealtimeCues();
  };

  const handleStartProcessing = async () => {
    if (cues.length === 0) return;

    setStatus(AppStatus.PROCESSING);
    setProgress(0);
    setErrorMsg(null);
    setSelectedIds(new Set()); 
    setRealtimeCues([]); 
    setRealtimeFilter('all'); 
    
    processedLinesRef.current = [];
    realtimeOverridesRef.current = {};
    setEditingRealtimeId(null);
    
    abortControllerRef.current = new AbortController();
    const originalTexts = cues.map(c => c.text);

    try {
      const correctedTexts = await fixSubtitlesWithGemini(
        originalTexts, 
        context,
        (processedCount, currentLines) => {
           if (!abortControllerRef.current?.signal.aborted) {
               setProgress(Math.round((processedCount / cues.length) * 100));
               processedLinesRef.current = currentLines;
               updateRealtimeCues();
           }
        },
        abortControllerRef.current.signal,
        selectedModel
      );

      if (abortControllerRef.current.signal.aborted) return;

      const finalTexts = correctedTexts.map((text, idx) => {
          return realtimeOverridesRef.current[idx] !== undefined ? realtimeOverridesRef.current[idx] : text;
      });

      let changeCount = 0;
      const updatedCues = cues.map((cue, index) => {
        const newText = finalTexts[index] !== undefined ? finalTexts[index] : cue.text;
        if (hasChanged(cue.text, newText)) changeCount++;
        return {
          ...cue,
          text: newText,
          originalText: cue.text,
          isConfirmed: false
        };
      });

      setCues(updatedCues);
      setResultFilter('modified'); 
      setStats({
        totalLines: cues.length,
        processedLines: cues.length,
        correctedCount: changeCount
      });
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      if (abortControllerRef.current?.signal.aborted || err.message === 'Processing aborted by user') {
        return; 
      }
      console.error(err);
      setErrorMsg("AI Processing Failed: " + (err.message || "Unknown error"));
      setStatus(AppStatus.ERROR);
    } finally {
        abortControllerRef.current = null;
    }
  };
  
  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setStatus(AppStatus.IDLE);
    setProgress(0);
  };

  const handleDownload = () => {
    const srtContent = buildSRT(cues);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_${fileName || 'subtitles.srt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setCues([]);
    setFileName('');
    setStats({ totalLines: 0, processedLines: 0, correctedCount: 0 });
    setProgress(0);
    setContext({ 
      projectContext: '', glossaryTerms: '',
      referenceUrl: '', referenceUrlContent: '',
      removeFillers: false, fixStutters: false, filterProfanity: false 
    });
    setUrlStatus('idle');
    setUrlPreviewTitle('');
    setSelectedIds(new Set());
    setEditingId(null);
    setRealtimeCues([]);
    setIsFocusMode(false);
    setShowResetDialog(false);
  };

  const handleSafeReset = () => {
    if (status === AppStatus.COMPLETE || status === AppStatus.PROCESSING) {
      setShowResetDialog(true);
    } else {
      handleReset();
    }
  };

  // --- Review & Edit Handlers ---

  const handleToggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = (visibleIds: number[]) => {
    if (visibleIds.every(id => selectedIds.has(id))) {
      const newSet = new Set(selectedIds);
      visibleIds.forEach(id => newSet.delete(id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      visibleIds.forEach(id => newSet.add(id));
      setSelectedIds(newSet);
    }
  };

  const handleDiscard = (id: number) => {
    // If in realtime mode, handle appropriately
    if (status === AppStatus.PROCESSING) {
        // Find index from id
        const idx = cues.findIndex(c => c.id === id);
        if (idx !== -1) handleRealtimeDiscard(idx);
    } else {
        setCues(prev => prev.map(c => c.id === id ? { ...c, text: c.originalText || '', isConfirmed: false } : c));
    }
    
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  };

  const handleEditStart = (cue: SubtitleCue) => {
    if (status === AppStatus.PROCESSING) {
        handleRealtimeEditStart(cue);
    } else {
        setEditingId(cue.id);
        setEditText(cue.text);
    }
  };

  const handleEditSave = (id?: number) => {
    if (status === AppStatus.PROCESSING) {
        // Need to find the index for realtime processing
        const idx = cues.findIndex(c => c.id === (id || editingRealtimeId));
        if (idx !== -1) handleRealtimeEditSave(idx);
    } else {
        if (editingId === null) return;
        setCues(prev => prev.map(c => c.id === editingId ? { ...c, text: editText, isConfirmed: true } : c));
        setEditingId(null);
        setEditText('');
    }
  };

  const handleEditCancel = () => {
    if (status === AppStatus.PROCESSING) {
        setEditingRealtimeId(null);
        setRealtimeEditText('');
    } else {
        setEditingId(null);
        setEditText('');
    }
  };

  const handleBatchDiscard = () => {
    if (status === AppStatus.PROCESSING) {
        // For processing, we need to map IDs to indices and revert overrides
         selectedIds.forEach(id => {
             const idx = cues.findIndex(c => c.id === id);
             if (idx !== -1) realtimeOverridesRef.current[idx] = cues[idx].text;
         });
         updateRealtimeCues();
    } else {
        setCues(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, text: c.originalText || '', isConfirmed: false } : c));
    }
    setSelectedIds(new Set());
  };

  // --- Render Helpers ---

  const renderUploadArea = () => (
    <div className="border-2 border-dashed border-slate-300/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-12 text-center hover:border-primary-500 dark:hover:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group relative overflow-hidden shadow-sm">
      <input 
        type="file" 
        accept=".srt" 
        onChange={handleFileUpload} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
      />
      <div className="flex flex-col items-center justify-center relative z-0">
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 text-slate-500 dark:text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400">
           <UploadIcon />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.dropTitle}</h3>
        <p className="text-slate-500 dark:text-slate-400">{t.dropDesc}</p>
      </div>
    </div>
  );

  const renderContextForm = () => (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border border-white/50 dark:border-slate-700/50 shadow-xl mb-8 rounded-lg relative overflow-visible">
      
      <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-primary-500 w-2 h-6 inline-block rounded-full"></span>
                {t.contextTitle}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                {t.contextDesc}
            </p>
          </div>
      </div>
      
      {/* Row 1: Model Selector */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">{t.modelLabel}</label>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.modelDesc}</p>
         </div>
         
         <div className="relative min-w-[200px]" ref={modelMenuRef}>
            <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-2.5 rounded-md text-sm font-medium hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            >
                <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedModel.includes('pro') ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                    {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-slate-400 transition-transform ${showModelMenu ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            
            {showModelMenu && (
                <div className="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    {AVAILABLE_MODELS.map(model => (
                        <button 
                            key={model.id}
                            onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedModel === model.id ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${model.id.includes('pro') ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                            <div className="flex flex-col">
                                <span>{model.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                    {model.id.includes('pro') ? t.modelPro : t.modelFlash}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
         </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Row 2: Description Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.descriptionLabel}
          </label>
          <textarea 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none rounded-md h-32 resize-none text-base leading-relaxed"
            placeholder={t.descriptionPlaceholder}
            value={context.projectContext}
            onChange={e => setContext({...context, projectContext: e.target.value})}
          />
        </div>

        {/* Row 3: Keywords Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.keywordsLabel}
          </label>
          <input 
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none rounded-md"
            placeholder={t.keywordsPlaceholder}
            value={context.glossaryTerms}
            onChange={e => setContext({...context, glossaryTerms: e.target.value})}
          />
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-slate-400"></span>
            {t.keywordsHint}
          </p>
        </div>

        {/* Reference URL Section - visually distinct/secondary */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {t.referenceUrlLabel} <span className="text-slate-400 font-normal normal-case ml-1">(Optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none rounded-md"
                placeholder={t.referenceUrlPlaceholder}
                value={context.referenceUrl}
                onChange={e => setContext({...context, referenceUrl: e.target.value})}
              />
              {context.referenceUrl && (
                <button 
                  onClick={handleClearUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  title="Clear URL"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={handleUrlFetch}
              disabled={urlStatus === 'loading'}
              className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-md"
            >
              {urlStatus === 'loading' ? t.fetching : t.fetchBtn}
            </button>
          </div>
          
          {/* URL Status Messages */}
          {urlStatus === 'error' && (
             <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
          )}

          {/* Website Snapshot Preview */}
          {urlStatus === 'success' && context.referenceUrlContent && (
            <div className="mt-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md relative group">
               <button 
                 onClick={handleClearUrl}
                 className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 bg-slate-100 dark:bg-slate-800 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Remove content"
               >
                 <XMarkIcon />
               </button>
               <div className="flex items-center justify-between mb-2 pr-8">
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   {t.snapshotTitle}
                 </h4>
                 <span className="text-xs text-slate-500">{t.verified}</span>
               </div>
               <div className="mb-2 text-xs font-semibold text-primary-600 dark:text-primary-400 truncate pr-6">
                 {urlPreviewTitle}
               </div>
               <div className="text-xs text-slate-600 dark:text-slate-400 h-24 overflow-y-auto custom-scrollbar border-t border-slate-200 dark:border-slate-700 pt-2 whitespace-pre-wrap">
                 {context.referenceUrlContent}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">{t.cleaningTitle}</h3>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
             {/* Checkboxes for cleaning options */}
             <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-all checked:border-primary-500 checked:bg-primary-500"
                  checked={context.removeFillers}
                  onChange={e => setContext({...context, removeFillers: e.target.checked})}
                />
                 <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.optFillers}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-all checked:border-primary-500 checked:bg-primary-500"
                  checked={context.fixStutters}
                  onChange={e => setContext({...context, fixStutters: e.target.checked})}
                />
                 <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.optStutters}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-all checked:border-primary-500 checked:bg-primary-500"
                  checked={context.filterProfanity}
                  onChange={e => setContext({...context, filterProfanity: e.target.checked})}
                />
                 <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
              </div>
              <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.optProfanity}</span>
            </label>
        </div>
      </div>

      {/* Row 5: Start Button */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
         <button 
            onClick={handleStartProcessing}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-bold py-4 shadow-lg shadow-primary-500/20 dark:shadow-primary-900/20 transition-all transform active:scale-[0.99] text-lg uppercase tracking-wide rounded-lg flex items-center justify-center"
        >
            <span>{t.magicBtn}</span>
        </button>
      </div>
    </div>
  );

  const renderWorkspace = () => {
    // Determine active dataset and filters based on status
    const isProcessing = status === AppStatus.PROCESSING;
    const activeCues = isProcessing ? realtimeCues : cues;
    const activeFilter = isProcessing ? realtimeFilter : resultFilter;
    const activeEditText = isProcessing ? realtimeEditText : editText;
    const activeEditingId = isProcessing ? editingRealtimeId : editingId;

    const displayedCues = activeCues.filter(cue => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'modified') return cue.text !== cue.originalText;
        if (activeFilter === 'unmodified') return cue.text === cue.originalText;
        return true;
    });

    const allVisibleSelected = displayedCues.length > 0 && displayedCues.every(c => selectedIds.has(c.id));

    // Handle Header Logic
    const renderHeader = () => {
        // Compute Current Stats for display
        const totalLines = cues.length;
        const currentCorrections = isProcessing 
            ? realtimeCues.filter(c => hasChanged(c.text, c.originalText || '')).length 
            : stats.correctedCount;
            
        if (isProcessing) {
            // Expanded/Focus Mode Processing Header
            if (isFocusMode) {
                return (
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-30 shadow-sm flex flex-col">
                        {/* Row 1: Stop Button */}
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                             <button 
                               onClick={handleCancelProcessing}
                               className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors flex items-center gap-1 group"
                            >
                               <ArrowLeftIcon className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                               {t.stopAndBack}
                            </button>
                        </div>
                        
                        {/* Row 2: Progress & Stats */}
                        <div>
                            {/* Slim Progress Bar */}
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                                 <div 
                                    className="h-full bg-primary-500 animate-stripe transition-all duration-300" 
                                    style={{ 
                                        width: `${progress}%`,
                                        backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                        backgroundSize: '1rem 1rem'
                                    }}
                                 />
                            </div>
                            <div className="px-4 py-2 flex items-center justify-between gap-4">
                                 <div className="flex items-center gap-4 text-xs sm:text-sm font-sans text-slate-600 dark:text-slate-400">
                                     <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                                        <span className="hidden sm:inline">{t.processingStatus}</span>
                                        <span>{progress}%</span>
                                     </div>
                                     <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                     <span className="whitespace-nowrap">{t.statTotal}: <b className="text-slate-900 dark:text-white">{totalLines}</b></span>
                                     <span className="whitespace-nowrap">{t.statCorrections}: <b className="text-primary-600 dark:text-primary-400">{currentCorrections}</b></span>
                                 </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // Standard Processing View
            return (
                 <div className="flex flex-col py-6 animate-in fade-in zoom-in-95 duration-500">
                     {/* Top Left Button */}
                    <div className="mb-4">
                        <button 
                           onClick={handleCancelProcessing}
                           className="mb-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors flex items-center gap-1 group"
                        >
                           <ArrowLeftIcon className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                           {t.stopAndBack}
                        </button>
                    </div>

                    {/* Centered Title & Progress Area */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 text-center tracking-tight">
                            {t.processingTitle}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-lg text-center leading-relaxed">
                            {t.processingDesc}
                        </p>
                        
                        {/* Progress Bar Container */}
                        <div className="w-full max-w-lg mb-2 relative space-y-2">
                             <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                                 <div 
                                    className="absolute top-0 left-0 h-full bg-primary-500 rounded-full animate-stripe transition-all duration-300 ease-out"
                                    style={{ 
                                        width: `${progress}%`,
                                        backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                        backgroundSize: '1rem 1rem'
                                    }}
                                 ></div>
                             </div>
                             <div className="flex justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                                {progress}%
                             </div>
                        </div>
                    </div>
                    
                    {/* Stats Line - Left aligned, matching Complete view styling */}
                    <div className="mt-auto flex gap-4 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{t.statTotal}: <span className="text-slate-900 dark:text-white">{totalLines}</span></span>
                        <span className="text-primary-600 dark:text-primary-400">{t.statCorrections}: <span className="text-slate-900 dark:text-white font-bold">{currentCorrections}</span></span>
                    </div>
                 </div>
            );
        } else {
            // COMPLETE STATE
            
            // Expanded/Focus Mode Complete Header
            if (isFocusMode) {
                 return (
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-30 shadow-sm px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm font-sans text-slate-600 dark:text-slate-400">
                             <span className="font-bold text-slate-900 dark:text-white">{t.completeTitle}</span>
                             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                             <span className="whitespace-nowrap">{t.statTotal}: <b className="text-slate-900 dark:text-white">{stats.totalLines}</b></span>
                             <span className="whitespace-nowrap">{t.statCorrections}: <b className="text-primary-600 dark:text-primary-400">{stats.correctedCount}</b></span>
                        </div>
                    </div>
                 );
            }

            // Standard Complete View
            return (
                 <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <button 
                           onClick={handleSafeReset}
                           className="mb-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors flex items-center gap-1 group"
                        >
                           <ArrowLeftIcon className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                           {t.newFile}
                        </button>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.completeTitle}</h2>
                        <div className="flex gap-4 text-sm mt-1">
                            <span className="text-slate-600 dark:text-slate-400">{t.statTotal}: <span className="text-slate-900 dark:text-white">{stats.totalLines}</span></span>
                            <span className="text-primary-600 dark:text-primary-400">{t.statCorrections}: <span className="text-slate-900 dark:text-white font-bold">{stats.correctedCount}</span></span>
                        </div>
                    </div>
                 </div>
            );
        }
    };

    return (
      <div className={`flex-1 flex flex-col min-h-0`}>
         <style>{`
            @keyframes stripe-slide {
              0% { background-position: 1rem 0; }
              100% { background-position: 0 0; }
            }
            .animate-stripe {
              animation: stripe-slide 1s linear infinite;
            }
         `}</style>

         {!isFocusMode && renderHeader()}
         
         <div className={`flex-1 flex flex-col overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-xl rounded-lg ${isFocusMode ? 'fixed inset-4 z-40' : ''}`}>
            
            {isFocusMode && renderHeader()}

            {/* Unified Toolbar */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    {/* Master Checkbox */}
                    <div className="pt-1 pl-1">
                       <input 
                         type="checkbox" 
                         className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 cursor-pointer w-4 h-4"
                         checked={allVisibleSelected}
                         onChange={() => handleSelectAll(displayedCues.map(c => c.id))}
                       />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-200 dark:bg-slate-700/50 p-1 rounded-lg">
                        <button
                            onClick={() => isProcessing ? setRealtimeFilter('all') : setResultFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeFilter === 'all' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {t.filterAll}
                        </button>
                        <button
                            onClick={() => isProcessing ? setRealtimeFilter('modified') : setResultFilter('modified')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeFilter === 'modified' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {t.filterModified}
                        </button>
                        <button
                            onClick={() => isProcessing ? setRealtimeFilter('unmodified') : setResultFilter('unmodified')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeFilter === 'unmodified' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {t.filterUnmodified}
                        </button>
                    </div>

                    {/* Separator */}
                    {selectedIds.size > 0 && <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>}

                    {/* Batch Actions */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                             {/* Selection Badge with Hover effect */}
                            <button
                               onClick={() => setSelectedIds(new Set())}
                               className="group flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                               title={t.unselect}
                            >
                               {/* Normal State */}
                               <div className="flex items-center gap-1.5 group-hover:hidden text-slate-500 dark:text-slate-400">
                                  <div className="w-4 h-4 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded flex items-center justify-center">
                                      <CheckIcon />
                                  </div>
                                  {selectedIds.size} {t.selected}
                               </div>
                               {/* Hover State */}
                               <div className="hidden group-hover:flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                   <div className="w-4 h-4 text-slate-500 dark:text-slate-400"><XMarkIcon className="w-4 h-4" /></div>
                                   {t.unselect}
                               </div>
                            </button>

                            <button 
                              onClick={handleBatchDiscard}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1"
                            >
                               <XMarkIcon className="w-3 h-3" />
                               {t.batchDiscard}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {!isProcessing && (
                        <button 
                          onClick={handleDownload}
                          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors text-sm"
                        >
                          <DownloadIcon />
                          {t.btnDownload}
                        </button>
                    )}
                    
                     {/* Expand / Collapse Button */}
                    <button 
                      onClick={() => setIsFocusMode(!isFocusMode)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                      title={isFocusMode ? t.collapse : t.expand}
                    >
                      {isFocusMode ? <CollapseIcon /> : <ExpandIcon />}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
               {displayedCues.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                      {isProcessing ? (
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin"></div>
                             <p>{t.processingStatus}</p>
                          </div>
                      ) : (
                          <>
                            <CheckIcon />
                            <p className="mt-4">{t.noChanges}</p>
                          </>
                      )}
                   </div>
               ) : (
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedCues.map(cue => {
                          const isModified = cue.text !== cue.originalText;
                          const isEditing = activeEditingId === cue.id;
                          const isSelected = selectedIds.has(cue.id);
                          
                          return (
                              <div 
                                key={cue.id} 
                                className={`
                                  group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative
                                  ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                                `}
                              >
                                  <div className="flex gap-4">
                                      {/* Checkbox (Hidden by default, visible on hover or selected) */}
                                      <div className={`pt-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                         <input 
                                           type="checkbox" 
                                           className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 cursor-pointer w-4 h-4"
                                           checked={isSelected}
                                           onChange={() => handleToggleSelection(cue.id)}
                                         />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{cue.id}</span>
                                              <span className="text-xs font-mono text-slate-500">{cue.startTime} → {cue.endTime}</span>
                                              {isModified && (
                                                  <span className="text-[10px] font-sans font-bold tracking-wider text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded ml-2">Modified</span>
                                              )}
                                          </div>

                                          {isEditing ? (
                                              <div className="mt-2">
                                                  <textarea 
                                                    className="w-full bg-white dark:bg-slate-900 border border-primary-300 dark:border-primary-700 focus:ring-2 focus:ring-primary-200 outline-none rounded p-2 text-slate-900 dark:text-white mb-2 font-mono text-base leading-relaxed"
                                                    value={activeEditText}
                                                    onChange={(e) => isProcessing ? setRealtimeEditText(e.target.value) : setEditText(e.target.value)}
                                                    autoFocus
                                                    rows={2}
                                                  />
                                                  <div className="flex gap-2">
                                                      <button 
                                                        onClick={() => handleEditSave()}
                                                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700 font-medium"
                                                      >
                                                        {t.saveBtn}
                                                      </button>
                                                      <button 
                                                        onClick={handleEditCancel}
                                                        className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                                                      >
                                                        {t.cancelBtn}
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="mt-1 flex flex-col md:flex-row gap-4 items-center justify-between">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                                      {/* Original */}
                                                      <div className={`font-mono text-slate-500 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700 text-sm leading-relaxed ${!isModified ? 'hidden md:block opacity-50' : ''}`}>
                                                          {cue.originalText}
                                                      </div>
                                                      
                                                      {/* New */}
                                                      <div className="font-mono text-slate-900 dark:text-slate-100 font-medium text-base leading-relaxed">
                                                         {cue.text || <span className="text-slate-400 italic text-sm font-sans">{t.deleted}</span>}
                                                      </div>
                                                  </div>
                                                  
                                                  {/* Actions (Hidden by default, visible on hover) */}
                                                  <div className="flex items-center gap-1 flex-shrink-0 mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                      <button 
                                                          onClick={() => handleDiscard(cue.id)}
                                                          className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                                              ${isModified 
                                                                  ? 'text-red-500 hover:text-red-600' 
                                                                  : 'text-slate-300 cursor-not-allowed opacity-50'
                                                              }
                                                          `}
                                                          disabled={!isModified}
                                                          title={t.actionRestore}
                                                      >
                                                          <UndoIcon />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleEditStart(cue)}
                                                          className="p-2 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                          title={t.actionEdit}
                                                      >
                                                          <PencilIcon />
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                   </div>
               )}
            </div>
          </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-primary-500/30 flex flex-col relative overflow-hidden">
      
      {/* Global Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Top Left Blob - Soft Lime/Green */}
         <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] min-w-[400px] min-h-[400px] rounded-full bg-primary-400/20 dark:bg-primary-500/10 blur-[100px]" />
         
         {/* Bottom Right Blob - Soft Blue/Purple/Cool Gray */}
         <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] min-w-[400px] min-h-[400px] rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.discardChangesTitle}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{t.discardChangesMsg}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md font-medium transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors shadow-sm"
              >
                {t.confirmDiscard}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Hidden in Focus Mode */}
      {!isFocusMode && (
          <header className="sticky top-0 z-20 flex-shrink-0 relative">
            <div className="max-w-7xl mx-auto px-6 py-1 flex justify-between items-center">
              
              {/* Logo Section */}
              <div className="flex items-center gap-6">
                 <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={handleSafeReset}>
                    <LogoIcon className="h-10 md:h-12 w-auto" />
                 </div>
              </div>
              
              <div className="flex items-center">

                <div className="flex items-center gap-4">
                     {/* Theme Switcher */}
                    <div className="relative" ref={themeMenuRef}>
                       <button 
                          onClick={() => setShowThemeMenu(!showThemeMenu)}
                          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors p-1"
                          title="Change theme"
                       >
                          {theme === 'light' && <SunIcon />}
                          {theme === 'dark' && <MoonIcon />}
                          {theme === 'system' && <ComputerIcon />}
                       </button>
                       
                       {showThemeMenu && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl rounded-lg border border-white/50 dark:border-slate-700/50 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${theme === 'light' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                              >
                                 <SunIcon className="w-4 h-4" />
                                 {t.themeLight}
                              </button>
                              <button 
                                onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                              >
                                 <MoonIcon className="w-4 h-4" />
                                 {t.themeDark}
                              </button>
                              <button 
                                onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${theme === 'system' ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                              >
                                 <ComputerIcon className="w-4 h-4" />
                                 {t.themeSystem}
                              </button>
                          </div>
                       )}
                    </div>

                    {/* Language Switcher */}
                    <button 
                      onClick={handleToggleLang}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                      title={lang === 'en' ? "Switch to Chinese" : "Switch to English"}
                    >
                        <GlobeIcon className="w-5 h-5" />
                        <span className="text-sm font-medium select-none w-5">{lang === 'en' ? 'EN' : '中'}</span>
                    </button>
                </div>

              </div>
            </div>
          </header>
      )}

      <main className={`max-w-7xl mx-auto px-6 py-8 flex-1 w-full relative z-10 ${isFocusMode ? 'flex flex-col h-screen py-0 px-0 max-w-none' : 'flex flex-col'}`}>
        
        {/* Error Banner */}
        {errorMsg && !isFocusMode && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 px-4 py-3 mb-6 text-sm">
            <strong>{t.errorLabel}</strong> {errorMsg}
          </div>
        )}

        {/* View 1: Upload & Config */}
        {(status === AppStatus.IDLE || status === AppStatus.PARSING) && (
          <div className="max-w-4xl mx-auto">
            {cues.length === 0 && (
            <div className="mb-12 text-center mt-8">
               <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                  {t.heroTitle}
                  <span className="block mt-2 text-3xl md:text-4xl bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                    {t.heroHighlight}
                  </span>
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  {t.heroSubtitle}
               </p>
            </div>
            )}

            {cues.length === 0 ? (
                renderUploadArea()
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border border-white/50 dark:border-slate-700/50 shadow-xl rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary-500 text-white p-1.5 rounded-md">
                                <CheckIcon className="w-3 h-3" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1">{fileName}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{cues.length} {t.parsed}</p>
                            </div>
                        </div>
                        <button onClick={() => setCues([])} className="text-sm font-medium text-green-500 hover:text-green-600 dark:text-greem-400 dark:hover:text-green-300 underline underline-offset-4 decoration-green-200 hover:decoration-green-500 transition-all">{t.removeFile}</button>
                    </div>

                    {renderContextForm()}
                </div>
            )}
          </div>
        )}

        {/* Combined View: Processing OR Complete */}
        {(status === AppStatus.PROCESSING || status === AppStatus.COMPLETE) && (
            renderWorkspace()
        )}

      </main>

      {/* Footer - Hidden in Focus Mode */}
      {!isFocusMode && (
          <footer className="flex-shrink-0 py-6 relative z-10">
             <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                 <div className="flex items-center gap-6">
                    <a 
                      href="https://www.linkedin.com/in/ning-zhang-688903303/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-primary-500 transition-colors"
                      title="LinkedIn"
                    >
                      <LinkedInIcon className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://ningdesignlab.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-primary-500 transition-colors"
                      title="Portfolio"
                    >
                      <NingLogoIcon className="h-5 w-auto" /> 
                    </a>
                 </div>
                 <p className="text-center">{t.footer}</p>
             </div>
          </footer>
      )}
    </div>
  );
};

export default App;