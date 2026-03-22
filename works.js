export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const apiBase = (env.SHORTEN_API_BASE || "https://sublink.yubb.pp.ua").replace(/\/+$/, '');

    // --- 代理接口：解决浏览器跨域问题 ---
    if (url.pathname === "/api/shorten") {
      const targetUrl = url.searchParams.get("url");
      const shortCode = url.searchParams.get("shortCode");
      if (!targetUrl || !shortCode) return new Response("Missing params", { status: 400 });
      const realApiUrl = apiBase + "/shorten-v2?url=" + encodeURIComponent(targetUrl) + "&shortCode=" + shortCode;
      try {
        const response = await fetch(realApiUrl);
        const data = await response.text();
        return new Response(data, {
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response("Proxy Error", { status: 500 });
      }
    }

    // --- 注入逻辑 ---
    const finalHtml = HTML_CONTENT.replace(
      'const API_BASE_PLACEHOLDER = "";',
      'const API_BASE_PLACEHOLDER = "' + apiBase + '";'
    );

    return new Response(finalHtml, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
  }
};

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMess 订阅生成器 Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c7d2fe; }
  </style>
</head>
<body>
<div id="root"></div>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">

const API_BASE_PLACEHOLDER = "";

const { useState } = React;

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const PRESET_DOMAINS = [
  'mfa.gov.ua', 'saas.sin.fan', 'store.ubi.com', 'cf.130519.xyz',
  'cf.008500.xyz', 'cf.090227.xyz', 'cf.877774.xyz',
  'cdns.doon.eu.org', 'sub.danfeng.eu.org', 'cf.zhetengsha.eu.org'
];

const COUNTRY_LIST = [
  { flag: '🇭🇰', name: '香港' },
  { flag: '🇯🇵', name: '日本' },
  { flag: '🇸🇬', name: '新加坡' },
  { flag: '🇺🇸', name: '美国' },
  { flag: '🇬🇧', name: '英国' },
  { flag: '🇩🇪', name: '德国' },
  { flag: '🇫🇷', name: '法国' },
  { flag: '🇳🇱', name: '荷兰' },
  { flag: '🇨🇦', name: '加拿大' },
  { flag: '🇦🇺', name: '澳大利亚' },
  { flag: '🇰🇷', name: '韩国' },
  { flag: '🇹🇼', name: '台湾' },
  { flag: '🇷🇺', name: '俄罗斯' },
  { flag: '🇹🇷', name: '土耳其' },
  { flag: '🇧🇷', name: '巴西' },
  { flag: '🇦🇷', name: '阿根廷' },
  { flag: '🇮🇳', name: '印度' },
  { flag: '🇮🇩', name: '印尼' },
  { flag: '🇵🇭', name: '菲律宾' },
  { flag: '🇹🇭', name: '泰国' },
  { flag: '🇻🇳', name: '越南' },
  { flag: '🇲🇾', name: '马来西亚' },
  { flag: '🇺🇦', name: '乌克兰' },
  { flag: '🇵🇱', name: '波兰' },
  { flag: '🇨🇭', name: '瑞士' },
  { flag: '🇸🇪', name: '瑞典' },
  { flag: '🇳🇴', name: '挪威' },
  { flag: '🇫🇮', name: '芬兰' },
  { flag: '🇿🇦', name: '南非' },
  { flag: '🌐', name: '未知' },
];

function VmessGenerator() {
  const [originalVmess, setOriginalVmess] = useState('');
  const [domains, setDomains] = useState(['']);
  const [generatedNodes, setGeneratedNodes] = useState([]);
  const [shortUuid, setShortUuid] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [usePresetDomains, setUsePresetDomains] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_LIST[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const encodeVmess = (config) => {
    const json = JSON.stringify(config);
    return "vmess://" + btoa(unescape(encodeURIComponent(json)));
  };

  const copyToClipboard = (text, feedback = '已复制') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(feedback);
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  const generateAndShorten = async () => {
    setError('');
    setShortUuid('');

    if (!originalVmess.trim()) return setError('请输入原始节点');

    const validDomains = usePresetDomains
      ? PRESET_DOMAINS
      : domains.filter(d => d.trim());
    if (validDomains.length === 0) return setError('请提供至少一个域名');

    setIsGenerating(true);

    try {
      const b64 = originalVmess.replace('vmess://', '').trim();
      const config = JSON.parse(atob(b64));

      // 节点名称 = 所选国旗 + 优选域名
      const nodes = validDomains.map(domain => {
        const ps = selectedCountry.flag + ' ' + domain.trim();
        const newConfig = { ...config, add: domain.trim(), ps };
        return { domain: domain.trim(), ps, vmess: encodeVmess(newConfig) };
      });

      setGeneratedNodes(nodes);

      const uuid = self.crypto.randomUUID();
      const longUrl =
        API_BASE_PLACEHOLDER +
        '/singbox?config=' +
        encodeURIComponent(nodes.map(n => n.vmess).join('\\n')) +
        '&ua=&selectedRules=%22comprehensive%22&customRules=%5B%5D';

      const response = await fetch(
        '/api/shorten?url=' + encodeURIComponent(longUrl) + '&shortCode=' + uuid
      );

      if (response.ok) {
        setShortUuid(uuid);
        setCopyFeedback('所有订阅已就绪！');
      } else {
        throw new Error('云端转换失败');
      }
    } catch (e) {
      setError('生成失败: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const subscriptionTypes = [
    { name: 'Xray Link',    path: '/x/' },
    { name: 'SingBox Link', path: '/b/' },
    { name: 'Clash Link',   path: '/c/' },
    { name: 'Surge Link',   path: '/s/' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 font-sans">
      <div className="max-w-4xl mx-auto">

        <div className="text-center py-10">
          <h1 className="text-4xl font-black text-slate-800 mb-2">VMess 订阅生成器 Pro</h1>
          <p className="text-slate-400">多协议支持 · 跨域代理 · 自动化部署</p>
        </div>

        {copyFeedback && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-8 py-3 rounded-full shadow-2xl z-50 animate-bounce font-bold">
            {copyFeedback}
          </div>
        )}

        {/* 原始节点输入 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
          <textarea
            value={originalVmess}
            onChange={(e) => setOriginalVmess(e.target.value)}
            placeholder="在此粘贴 vmess:// 原始节点"
            className="w-full h-28 p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-200 focus:outline-none transition-all font-mono text-sm"
          />
        </div>

        {/* 国家选择 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-700 uppercase tracking-widest text-sm">节点归属地</span>
            <span className="text-xs text-slate-400">国旗将拼接在节点名称前</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-indigo-200 transition-colors text-left"
            >
              <span className="text-2xl">{selectedCountry.flag}</span>
              <span className="font-bold text-slate-700">{selectedCountry.name}</span>
              <span className="ml-auto text-slate-400 text-xs font-mono">预览：{selectedCountry.flag} cf.130519.xyz</span>
              <span className="text-slate-300 ml-2">▾</span>
            </button>

            {showCountryPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-10 max-h-64 overflow-y-auto custom-scrollbar">
                {COUNTRY_LIST.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                    className={"w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left" + (selectedCountry.name === c.name ? ' bg-indigo-50' : '')}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-sm text-slate-600">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 优选域名配置 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-slate-700 uppercase tracking-widest text-sm">优选域名配置</span>
            <button
              onClick={() => setUsePresetDomains(!usePresetDomains)}
              className="text-xs font-black uppercase tracking-widest text-indigo-600 px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              {usePresetDomains ? '切换自定义' : '使用内置列表'}
            </button>
          </div>

          {usePresetDomains ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRESET_DOMAINS.map((d, i) => (
                <div key={i} className="bg-slate-50 px-3 py-2 rounded-xl text-xs font-mono text-slate-500 border border-slate-100 text-center uppercase tracking-tighter">
                  {d}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={d}
                    onChange={(e) => { const nd = [...domains]; nd[i] = e.target.value; setDomains(nd); }}
                    className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-slate-200 focus:outline-none"
                    placeholder="example.com"
                  />
                  {domains.length > 1 && (
                    <button onClick={() => setDomains(domains.filter((_, idx) => idx !== i))} className="p-3 text-red-400 hover:bg-red-50 rounded-xl">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setDomains([...domains, ''])} className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-bold hover:bg-slate-50">
                + 添加更多
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-center font-bold">{error}</div>
        )}

        <button
          onClick={generateAndShorten}
          disabled={isGenerating}
          className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all mb-10 shadow-indigo-200"
        >
          {isGenerating ? '正在生成订阅...' : '立即生成 4 种订阅地址'}
        </button>

        {shortUuid && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionTypes.map((type) => (
                <div key={type.name} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{type.name}</span>
                    <button
                      onClick={() => copyToClipboard(API_BASE_PLACEHOLDER + type.path + shortUuid)}
                      className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {API_BASE_PLACEHOLDER}{type.path}{shortUuid}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-sm font-black text-slate-700 mb-4 border-b pb-2 uppercase tracking-widest">
                节点预览 ({generatedNodes.length})
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px]">
                {generatedNodes.map((node, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-600 truncate mr-4 italic">{node.ps}</span>
                    <button onClick={() => copyToClipboard(node.vmess)} className="text-slate-300 hover:text-indigo-600">
                      <CopyIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

ReactDOM.render(<VmessGenerator />, document.getElementById('root'));
</script>
</body>
</html>`;
