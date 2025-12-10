import React, { useState, useRef, useEffect } from 'react';
import { SubtitleCue, ContextInfo, AppStatus, ProcessingStats } from './types';
import { parseSRT, buildSRT, hasChanged } from './utils/subtitleParser';
import { fixSubtitlesWithGemini } from './services/geminiService';
import { UploadIcon, CheckIcon, ArrowRightIcon, XMarkIcon, LogoIcon, GlobeIcon, SunIcon, MoonIcon, ComputerIcon, RobotIcon } from './components/Icons';

type Theme = 'light' | 'dark' | 'system';
type Lang = 'en' | 'zh';

const translations = {
  en: {
    appName: "SubLime Captions",
    slogan: "Keep Your Captions Fresh.",
    subheading: "Squeeze out typos, filler words, and awkward grammar. AI-powered proofreading that makes your subtitles flawless.",
    contextTitle: "Context Information",
    contextDesc: "Providing details helps the AI understand specific names, places, and context (e.g., \"Algonquin College\").",
    speakerLabel: "Speaker Name(s)",
    speakerPlaceholder: "e.g. John Doe, Prof. Li",
    topicLabel: "Topic / Theme",
    topicPlaceholder: "e.g. Education in Canada, Tech Startup",
    keywordsLabel: "Keywords / Glossary (Important)",
    keywordsPlaceholder: "e.g. Algonquin College, Ottawa, React, TypeScript",
    keywordsNote: "Comma separated list of proper nouns often misspelled.",
    extraContextLabel: "Additional Context",
    extraContextPlaceholder: "Any other details? e.g. 'Interview took place in 1990', 'Casual conversation'",
    referenceUrlLabel: "Reference URL",
    referenceUrlPlaceholder: "https://en.wikipedia.org/wiki/Algonquin_College",
    fetchBtn: "Fetch & Verify",
    fetching: "Fetching...",
    fetchError: "Please enter a URL.",
    fetchInvalid: "Invalid URL format. Please include http:// or https://",
    snapshotTitle: "Website Snapshot",
    verified: "Content Verified",
    cleaningTitle: "Cleaning Options",
    optFillers: "Remove Filler Words (um, ah, like)",
    optStutters: "Fix Stutters (I... I went)",
    optProfanity: "Filter Profanity",
    dropTitle: "Drop your .srt file here",
    dropDesc: "or click to browse",
    parsed: "lines parsed",
    removeFile: "Remove",
    magicBtn: "Start Magic Fix",
    processingTitle: "AI is reading your subtitles...",
    processingDesc: "Analyzing context and fixing typos. This might take a moment.",
    cancelProcessing: "Stop & Edit Settings",
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
    noChanges: "No changes found.",
    viewAll: "View all lines",
    btnNewFile: "New File",
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
    themeSystem: "System"
  },
  zh: {
    appName: "SubLime Captions",
    slogan: "让你的字幕焕然一新。",
    subheading: "挤掉错别字、语气词和尴尬的语法。利用 AI 驱动的校对，让你的字幕完美无瑕。",
    contextTitle: "背景资料",
    contextDesc: "提供详细信息有助于 AI 理解特定的人名、地名和语境（例如：“亚岗昆学院”）。",
    speakerLabel: "说话人姓名",
    speakerPlaceholder: "例如：张三, 李教授",
    topicLabel: "话题 / 主题",
    topicPlaceholder: "例如：加拿大教育, 科技创业",
    keywordsLabel: "关键词 / 术语表 (重要)",
    keywordsPlaceholder: "例如：亚岗昆学院, 渥太华, React, TypeScript",
    keywordsNote: "请用逗号分隔经常识别错误的专有名词。",
    extraContextLabel: "补充背景",
    extraContextPlaceholder: "还有其他细节吗？例如：“采访发生于1990年”，“非正式谈话”",
    referenceUrlLabel: "参考链接",
    referenceUrlPlaceholder: "https://zh.wikipedia.org/wiki/亚岗昆学院",
    fetchBtn: "获取并验证",
    fetching: "获取中...",
    fetchError: "请输入网址。",
    fetchInvalid: "网址格式无效。请包含 http:// 或 https://",
    snapshotTitle: "网页快照",
    verified: "内容已验证",
    cleaningTitle: "清理选项",
    optFillers: "去除语气词 (嗯, 啊, 那个, um, ah)",
    optStutters: "修复口吃/重复 (我...我去)",
    optProfanity: "过滤脏话",
    dropTitle: "拖拽 .srt 文件到这里",
    dropDesc: "或点击浏览",
    parsed: "行已解析",
    removeFile: "移除文件",
    magicBtn: "开始智能修复",
    processingTitle: "AI 正在阅读您的字幕...",
    processingDesc: "正在分析语境并修复错别字。请稍候。",
    cancelProcessing: "停止并修改设置",
    completeTitle: "修复完成",
    statTotal: "总行数",
    statCorrections: "发现的修改",
    btnSelectAll: "全选",
    btnConfirm: "确认",
    btnDiscard: "放弃",
    btnBatchConfirm: "批量确认",
    btnBatchDiscard: "批量放弃",
    chkShowAll: "显示所有行",
    btnDownload: "下载 SRT",
    noChanges: "未发现修改。",
    viewAll: "查看所有行",
    btnNewFile: "打开新文件",
    editBtn: "编辑",
    saveBtn: "保存",
    cancelBtn: "取消",
    okBtn: "确认",
    xBtn: "放弃",
    footer: "© " + new Date().getFullYear() + " Ning Zhang. 版权所有。",
    selectItemsPrompt: "选择项目以进行批量操作",
    deleted: "(已删除)",
    errorLabel: "错误：",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统"
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
    speakerName: '',
    topic: '',
    keywords: '',
    extraContext: '',
    referenceUrl: '',
    referenceUrlContent: '',
    removeFillers: false,
    fixStutters: false,
    filterProfanity: false
  });
  
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

  // Review & Edit State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [viewAllLines, setViewAllLines] = useState<boolean>(false);

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
  };

  const parseHtml = (html: string, baseUrl: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.title || baseUrl;
    // Remove non-content elements to get cleaner text
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
    try {
      urlObj = new URL(urlStr);
    } catch (_) {
      setUrlStatus('error');
      setErrorMsg(t.fetchInvalid);
      return;
    }

    setUrlStatus('loading');
    setErrorMsg(null);

    let fetchedHtml = '';
    let success = false;
    let finalTitle = '';

    // Special handling for Wikipedia (Use Official API)
    if (urlObj.hostname.includes('wikipedia.org')) {
      try {
        // Construct API URL: https://{lang}.wikipedia.org/api/rest_v1/page/html/{title}
        // Extract title from path: /wiki/Title
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
      } catch (e) {
        console.warn("Wikipedia API failed:", e);
      }
    }

    // Generic Proxy Strategies
    if (!success) {
        // Strategy 1: CORS Proxy IO
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(urlStr)}`);
            if (response.ok) {
                const text = await response.text();
                if (!isBlockedContent(text)) {
                    fetchedHtml = text;
                    success = true;
                }
            }
        } catch (e) { console.warn("CorsProxy failed", e); }
    }

    if (!success) {
      // Strategy 2: AllOrigins
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlStr)}&disableCache=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.contents && !isBlockedContent(data.contents)) {
            fetchedHtml = data.contents;
            success = true;
          }
        }
      } catch (e) {
        console.warn("AllOrigins proxy failed:", e);
      }
    }

    if (!success) {
      // Strategy 3: CodeTabs
      try {
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlStr)}`);
        if (response.ok) {
          const text = await response.text();
           if (!isBlockedContent(text)) {
              fetchedHtml = text;
              success = true;
           }
        }
      } catch (e) {
        console.warn("CodeTabs proxy failed:", e);
      }
    }

    if (!success || !fetchedHtml) {
      setUrlStatus('error');
      setErrorMsg("Failed to fetch content. The website is blocking access or proxies are unavailable.");
      return;
    }

    try {
      const { title, content } = parseHtml(fetchedHtml, urlStr);
      
      // Double check content length after parsing
      if (content.length < 50) {
          throw new Error("Could not extract enough readable text from this website.");
      }

      setContext(prev => ({
        ...prev,
        referenceUrlContent: content
      }));
      setUrlPreviewTitle(finalTitle || title);
      setUrlStatus('success');
    } catch (err: any) {
      console.error(err);
      setUrlStatus('error');
      setErrorMsg(`Error parsing website: ${err.message || "Unknown error"}`);
    }
  };

  const handleClearUrl = () => {
    setContext(prev => ({
      ...prev,
      referenceUrl: '',
      referenceUrlContent: ''
    }));
    setUrlStatus('idle');
    setUrlPreviewTitle('');
    setErrorMsg(null);
  };

  const handleStartProcessing = async () => {
    if (cues.length === 0) return;

    setStatus(AppStatus.PROCESSING);
    setProgress(0);
    setErrorMsg(null);
    setSelectedIds(new Set()); 
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const originalTexts = cues.map(c => c.text);

    try {
      const correctedTexts = await fixSubtitlesWithGemini(
        originalTexts, 
        context,
        (processedCount) => {
           // If aborted, we might still get a progress callback, ignore it if we can't stop immediate
           if (!abortControllerRef.current?.signal.aborted) {
               setProgress(Math.round((processedCount / cues.length) * 100));
           }
        },
        abortControllerRef.current.signal,
        selectedModel
      );

      // Check one last time before committing state
      if (abortControllerRef.current.signal.aborted) return;

      let changeCount = 0;
      const updatedCues = cues.map((cue, index) => {
        const newText = correctedTexts[index] !== undefined ? correctedTexts[index] : cue.text;
        if (hasChanged(cue.text, newText)) {
          changeCount++;
        }
        return {
          ...cue,
          text: newText,
          originalText: cue.text,
          isConfirmed: false
        };
      });

      setCues(updatedCues);
      setStats({
        totalLines: cues.length,
        processedLines: cues.length,
        correctedCount: changeCount
      });
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      if (abortControllerRef.current?.signal.aborted || err.message === 'Processing aborted by user') {
        console.log("Processing cancelled by user");
        return; // Do not set error state if user cancelled
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
      speakerName: '', topic: '', keywords: '', extraContext: '',
      referenceUrl: '', referenceUrlContent: '',
      removeFillers: false, fixStutters: false, filterProfanity: false 
    });
    setUrlStatus('idle');
    setUrlPreviewTitle('');
    setSelectedIds(new Set());
    setEditingId(null);
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

  const handleConfirm = (id: number) => {
    setCues(prev => prev.map(c => c.id === id ? { ...c, isConfirmed: true } : c));
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  };

  const handleDiscard = (id: number) => {
    setCues(prev => prev.map(c => c.id === id ? { ...c, text: c.originalText || '', isConfirmed: false } : c));
    if (selectedIds.has(id)) {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  };

  const handleEditStart = (cue: SubtitleCue) => {
    setEditingId(cue.id);
    setEditText(cue.text);
  };

  const handleEditSave = () => {
    if (editingId === null) return;
    setCues(prev => prev.map(c => c.id === editingId ? { ...c, text: editText, isConfirmed: true } : c));
    setEditingId(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleBatchConfirm = () => {
    setCues(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, isConfirmed: true } : c));
    setSelectedIds(new Set());
  };

  const handleBatchDiscard = () => {
    setCues(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, text: c.originalText || '', isConfirmed: false } : c));
    setSelectedIds(new Set());
  };

  // --- Render Helpers ---

  const renderContextForm = () => (
    <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
        <span className="bg-primary-500 w-2 h-6 inline-block"></span>
        {t.contextTitle}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
        {t.contextDesc}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.speakerLabel}</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder={t.speakerPlaceholder}
            value={context.speakerName}
            onChange={e => setContext({...context, speakerName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.topicLabel}</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder={t.topicPlaceholder}
            value={context.topic}
            onChange={e => setContext({...context, topic: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.keywordsLabel}
          </label>
          <input 
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder={t.keywordsPlaceholder}
            value={context.keywords}
            onChange={e => setContext({...context, keywords: e.target.value})}
          />
          <p className="text-xs text-slate-500 mt-1">{t.keywordsNote}</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.extraContextLabel}</label>
          <textarea 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
            placeholder={t.extraContextPlaceholder}
            value={context.extraContext}
            onChange={e => setContext({...context, extraContext: e.target.value})}
          />
        </div>

        {/* Reference URL Section */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.referenceUrlLabel}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 pl-4 pr-10 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
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
                  <XMarkIcon />
                </button>
              )}
            </div>
            <button 
              onClick={handleUrlFetch}
              disabled={urlStatus === 'loading'}
              className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
            <div className="mt-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 relative group">
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
    </div>
  );

  const renderUploadArea = () => (
    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-800/50">
      <input 
        type="file" 
        accept=".srt"
        onChange={handleFileUpload}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className="text-primary-500 mb-4">
          <UploadIcon />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{t.dropTitle}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.dropDesc}</p>
      </div>
    </div>
  );

  const renderDiffView = () => {
    // Determine which cues to show
    const visibleCues = cues.filter(cue => viewAllLines || (cue.originalText && cue.text !== cue.originalText));
    const visibleIds = visibleCues.map(c => c.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header / Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={allVisibleSelected}
                  onChange={() => handleSelectAll(visibleIds)}
                  className="w-5 h-5 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.btnSelectAll}</span>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

              {selectedIds.size > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium bg-primary-600 px-2 py-0.5">{selectedIds.size}</span>
                  <button onClick={handleBatchConfirm} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 transition-colors">
                    {t.btnBatchConfirm}
                  </button>
                  <button onClick={handleBatchDiscard} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors">
                    {t.btnBatchDiscard}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">{t.selectItemsPrompt}</div>
              )}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={viewAllLines} 
                onChange={e => setViewAllLines(e.target.checked)}
                className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-600 focus:ring-primary-500"
              />
              {t.chkShowAll}
            </label>
            <button 
                  onClick={handleReset}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium transition-colors"
                >
                  {t.btnNewFile}
            </button>
            <button 
                onClick={handleDownload}
                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 text-sm font-medium transition-colors"
            >
                {t.btnDownload}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
          {visibleCues.map((cue) => {
              const isChanged = cue.originalText && cue.text !== cue.originalText;
              const isEditing = editingId === cue.id;
              
              return (
                  <div 
                    key={cue.id} 
                    className={`
                      grid grid-cols-[auto_80px_1fr_auto] md:grid-cols-[auto_80px_1fr_20px_1fr_auto] gap-4 p-3 border transition-colors items-center
                      ${isEditing ? 'border-primary-500 bg-white dark:bg-slate-800 ring-1 ring-primary-500/50' : 
                        cue.isConfirmed ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10' :
                        isChanged ? 'border-primary-200 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                      {/* Checkbox */}
                      <div>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(cue.id)}
                          onChange={() => handleToggleSelection(cue.id)}
                          className="w-5 h-5 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </div>

                      {/* Timecode */}
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden md:block">
                          {cue.startTime.split(',')[0]}
                      </div>
                      
                      {/* Original Text */}
                      <div className={`text-sm md:col-span-1 col-span-2 ${isChanged ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {cue.originalText}
                      </div>

                      {/* Arrow (Desktop only) */}
                      <div className="hidden md:flex justify-center text-slate-400 dark:text-slate-600">
                         {isChanged && <ArrowRightIcon />}
                      </div>

                      {/* Corrected Text (Editable) */}
                      <div className="text-sm col-span-2 md:col-span-1">
                        {isEditing ? (
                          <div className="flex gap-2">
                             <input 
                                autoFocus
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-primary-500 px-2 py-1 text-slate-900 dark:text-white outline-none"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave();
                                  if (e.key === 'Escape') handleEditCancel();
                                }}
                             />
                          </div>
                        ) : (
                          <div className={`break-words ${isChanged ? 'text-slate-900 dark:text-primary-100 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                            {cue.text === '' ? <span className="text-slate-400 dark:text-slate-600 italic">{t.deleted}</span> : cue.text}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end">
                        {isEditing ? (
                          <>
                             <button onClick={handleEditSave} className="px-2 py-0.5 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium" title={t.saveBtn}>
                                {t.saveBtn}
                             </button>
                             <button onClick={handleEditCancel} className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium" title={t.cancelBtn}>
                                {t.cancelBtn}
                             </button>
                          </>
                        ) : (
                          <>
                             <button onClick={() => handleEditStart(cue)} className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white font-medium border border-slate-200 dark:border-slate-700" title={t.editBtn}>
                                {t.editBtn}
                             </button>
                             {isChanged && (
                               <>
                                 <button 
                                  onClick={() => handleConfirm(cue.id)} 
                                  className={`px-2 py-0.5 text-xs font-medium border ${
                                    cue.isConfirmed 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' 
                                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 border-slate-200 dark:border-slate-700'
                                  }`} 
                                  title={t.btnConfirm}
                                 >
                                    {t.okBtn}
                                 </button>
                                 <button 
                                  onClick={() => handleDiscard(cue.id)} 
                                  className="px-2 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium border border-slate-200 dark:border-slate-700" 
                                  title={t.btnDiscard}
                                 >
                                    {t.xBtn}
                                 </button>
                               </>
                             )}
                          </>
                        )}
                      </div>
                  </div>
              );
          })}
          {visibleCues.length === 0 && (
               <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <CheckIcon />
                  </div>
                  <p>{t.noChanges}</p>
                  <button onClick={() => setViewAllLines(true)} className="text-primary-600 dark:text-primary-400 hover:underline mt-2 text-sm">{t.viewAll}</button>
               </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-primary-500/30 flex flex-col bg-gradient-to-br from-primary-500/10 via-slate-100 to-indigo-200/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={handleReset}>
            <LogoIcon className="h-12 md:h-16 w-auto" />
          </div>
          
          <div className="flex items-center gap-6">

            <div className="flex items-center gap-6">
                 {/* Model Selector (Only visible in IDLE/PARSING state) */}
                 {(status === AppStatus.IDLE || status === AppStatus.PARSING) && (
                    <div className="relative" ref={modelMenuRef}>
                        <button 
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors p-1"
                            title="Select AI Model"
                        >
                            <RobotIcon className="w-6 h-6" />
                        </button>
                        
                        {showModelMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                {AVAILABLE_MODELS.map(model => (
                                    <button 
                                        key={model.id}
                                        onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedModel === model.id ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedModel === model.id ? 'bg-primary-500' : 'bg-transparent'}`}></div>
                                        {model.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                 )}

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
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
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

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 px-4 py-3 mb-6 text-sm">
            <strong>{t.errorLabel}</strong> {errorMsg}
          </div>
        )}

        {/* View 1: Upload & Config */}
        {(status === AppStatus.IDLE || status === AppStatus.PARSING) && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center mt-8">
               <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                  {t.slogan}
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  {t.subheading}
               </p>
            </div>

            {cues.length === 0 ? (
                renderUploadArea()
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 p-2">
                                <CheckIcon />
                            </div>
                            <div>
                                <p className="text-slate-900 dark:text-white font-medium">{fileName}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{cues.length} {t.parsed}</p>
                            </div>
                        </div>
                        <button onClick={() => setCues([])} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 underline">{t.removeFile}</button>
                    </div>

                    {renderContextForm()}

                    <button 
                        onClick={handleStartProcessing}
                        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-bold py-4 shadow-lg shadow-primary-500/20 dark:shadow-primary-900/20 transition-all transform active:scale-[0.99] text-lg uppercase tracking-wide"
                    >
                        {t.magicBtn}
                    </button>
                </div>
            )}
          </div>
        )}

        {/* View 2: Processing */}
        {status === AppStatus.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                <div 
                    className="absolute inset-0 border-4 border-primary-500 border-t-transparent animate-spin rounded-full"
                ></div>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.processingTitle}</h2>
             <p className="text-slate-600 dark:text-slate-400 mb-6">{t.processingDesc}</p>
             
             <div className="w-full max-w-md bg-slate-200 dark:bg-slate-800 h-2 overflow-hidden rounded-full">
                <div 
                    className="bg-primary-500 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
             </div>
             <p className="mt-2 text-slate-500 font-mono text-sm">{progress}%</p>

             {/* Stop / Cancel Button */}
             <button 
                onClick={handleCancelProcessing}
                className="mt-8 px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium uppercase tracking-wide"
             >
                {t.cancelProcessing}
             </button>
          </div>
        )}

        {/* View 3: Results */}
        {status === AppStatus.COMPLETE && (
          <div className="h-[calc(100vh-220px)] flex flex-col">
             <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.completeTitle}</h2>
                    <div className="flex gap-4 text-sm mt-1">
                        <span className="text-slate-600 dark:text-slate-400">{t.statTotal}: <span className="text-slate-900 dark:text-white">{stats.totalLines}</span></span>
                        <span className="text-primary-600 dark:text-primary-400">{t.statCorrections}: <span className="text-slate-900 dark:text-white font-bold">{stats.correctedCount}</span></span>
                    </div>
                </div>
             </div>
             {renderDiffView()}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-slate-500 dark:text-slate-500 text-sm flex-shrink-0">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;