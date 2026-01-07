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

        function VmessGenerator() {
            const [originalVmess, setOriginalVmess] = useState('');
            const [domains, setDomains] = useState(['']);
            const [generatedNodes, setGeneratedNodes] = useState([]);
            const [shortUuid, setShortUuid] = useState('');
            const [isGenerating, setIsGenerating] = useState(false);
            const [error, setError] = useState('');
            const [copyFeedback, setCopyFeedback] = useState('');
            const [usePresetDomains, setUsePresetDomains] = useState(false);

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
                const validDomains = usePresetDomains ? PRESET_DOMAINS : domains.filter(d => d.trim());
                
                setIsGenerating(true);
                try {
                    const b64 = originalVmess.replace('vmess://', '').trim();
                    const config = JSON.parse(atob(b64));
                    
                    const nodes = validDomains.map(domain => {
                        const newConfig = { ...config, add: domain.trim(), ps: (config.ps || '节点') + ' - ' + domain.trim() };
                        return { domain: domain.trim(), vmess: encodeVmess(newConfig) };
                    });
                    setGeneratedNodes(nodes);

                    const uuid = self.crypto.randomUUID();
                    const longUrl = API_BASE_PLACEHOLDER + '/singbox?config=' + encodeURIComponent(nodes.map(n => n.vmess).join('\\n')) + '&ua=&selectedRules=%22comprehensive%22&customRules=%5B%5D';
                    
                    const response = await fetch("/api/shorten?url=" + encodeURIComponent(longUrl) + "&shortCode=" + uuid);
                    if (response.ok) {
                        setShortUuid(uuid);
                        setCopyFeedback('所有订阅已生成！');
                    } else {
                        throw new Error('转换失败');
                    }
                } catch (e) {
                    setError('生成失败: ' + e.message);
                } finally {
                    setIsGenerating(false);
                }
            };

            const subscriptionTypes = [
                { name: 'Xray Link', path: '/x/' },
                { name: 'SingBox Link', path: '/b/' },
                { name: 'Clash Link', path: '/c/' },
                { name: 'Surge Link', path: '/s/' }
            ];

            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-4 pb-20 font-sans">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-10">
                            <h1 className="text-4xl font-black text-indigo-900 mb-2">VMess 订阅生成器 Pro</h1>
                            <p className="text-slate-500 font-medium">多协议支持 · 优选域名 · 自动短链</p>
                        </div>

                        {copyFeedback && (
                            <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-3 rounded-full shadow-2xl z-50 animate-bounce font-bold">
                                {copyFeedback}
                            </div>
                        )}

                        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
                            <textarea
                                value={originalVmess}
                                onChange={(e) => setOriginalVmess(e.target.value)}
                                placeholder="在此粘贴 vmess:// 原始节点"
                                className="w-full h-28 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm"
                            />
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-slate-700">优选域名</span>
                                <button onClick={() => setUsePresetDomains(!usePresetDomains)} className="text-sm font-bold text-indigo-600 px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100">
                                    {usePresetDomains ? '使用自定义' : '使用内置列表'}
                                </button>
                            </div>
                            {!usePresetDomains && (
                                <div className="space-y-3">
                                    {domains.map((d, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input value={d} onChange={(e) => { const nd = [...domains]; nd[i] = e.target.value; setDomains(nd); }} className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-slate-50 focus:border-indigo-400 focus:outline-none" placeholder="example.com" />
                                            <button onClick={() => setDomains(domains.filter((_, idx) => idx !== i))} className="p-3 text-red-400 hover:bg-red-50 rounded-xl">✕</button>
                                        </div>
                                    ))}
                                    <button onClick={() => setDomains([...domains, ''])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-400">+ 添加更多</button>
                                </div>
                            )}
                        </div>

                        <button onClick={generateAndShorten} disabled={isGenerating} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all mb-10">
                            {isGenerating ? '正在同步云端数据...' : '立即生成 4 种订阅地址'}
                        </button>

                        {shortUuid && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                {subscriptionTypes.map((type) => (
                                    <div key={type.name} className="bg-white p-6 rounded-3xl shadow-md border border-indigo-50 hover:border-indigo-200 transition-all group">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{type.name}</span>
                                            <button 
                                                onClick={() => copyToClipboard(API_BASE_PLACEHOLDER + type.path + shortUuid)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"
                                            >
                                                <CopyIcon />
                                            </button>
                                        </div>
                                        <div className="text-sm font-mono text-slate-600 break-all bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {API_BASE_PLACEHOLDER}{type.path}{shortUuid}
                                        </div>
                                    </div>
                                ))}
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
