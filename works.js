export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const apiBase = (env.SHORTEN_API_BASE || "https://sublink.yubb.pp.ua").replace(/\/+$/, '');

    // --- 代理接口：解决浏览器跨域问题 ---
    if (url.pathname === "/api/shorten") {
      const targetUrl = url.searchParams.get("url");
      const shortCode = url.searchParams.get("shortCode");
      
      if (!targetUrl || !shortCode) {
        return new Response("Missing parameters", { status: 400 });
      }

      // 在服务器端请求后端 API
      const realApiUrl = apiBase + "/shorten-v2?url=" + encodeURIComponent(targetUrl) + "&shortCode=" + shortCode;
      
      try {
        const response = await fetch(realApiUrl);
        const data = await response.text();
        return new Response(data, {
          headers: { 
            "content-type": "text/plain;charset=UTF-8",
            "Access-Control-Allow-Origin": "*" // 允许你自己的前端读取结果
          }
        });
      } catch (e) {
        return new Response("Proxy Error: " + e.message, { status: 500 });
      }
    }

    // --- 注入逻辑：把 API 地址传给前端显示链接用 ---
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

        const Copy = ({ className = "w-5 h-5" }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        );

        const Plus = ({ className = "w-5 h-5" }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        );

        const X = ({ className = "w-5 h-5" }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        );

        const Sparkles = ({ className = "w-8 h-8" }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z"></path>
                <path d="M19 12L19.5 13.5L21 14L19.5 14.5L19 16L18.5 14.5L17 14L18.5 13.5L19 12Z"></path>
                <path d="M6 19L6.5 20.5L8 21L6.5 21.5L6 23L5.5 21.5L4 21L5.5 20.5L6 19Z"></path>
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
            const [shortUrl, setShortUrl] = useState('');
            const [isGenerating, setIsGenerating] = useState(false);
            const [error, setError] = useState('');
            const [copyFeedback, setCopyFeedback] = useState('');
            const [usePresetDomains, setUsePresetDomains] = useState(false);

            const decodeVmess = (vmessUrl) => {
                try {
                    const base64Part = vmessUrl.replace('vmess://', '').trim();
                    const decoded = atob(base64Part);
                    return JSON.parse(decoded);
                } catch (e) {
                    throw new Error('无效的 VMess 链接格式');
                }
            };

            const encodeVmess = (config) => {
                const json = JSON.stringify(config);
                const base64 = btoa(unescape(encodeURIComponent(json)));
                return "vmess://" + base64;
            };

            const copyToClipboard = (text, feedback = '已复制') => {
                navigator.clipboard.writeText(text).then(() => {
                    setCopyFeedback(feedback);
                    setTimeout(() => setCopyFeedback(''), 2000);
                });
            };

            const generateAndShorten = async () => {
                setError('');
                setGeneratedNodes([]);
                setShortUrl('');
                if (!originalVmess.trim()) {
                    setError('请输入原始 VMess 节点');
                    return;
                }
                const validDomains = usePresetDomains ? PRESET_DOMAINS : domains.filter(d => d.trim());
                if (validDomains.length === 0) {
                    setError('请提供至少一个优选域名');
                    return;
                }
                setIsGenerating(true);
                try {
                    const config = decodeVmess(originalVmess);
                    const nodes = validDomains.map(domain => {
                        const newConfig = { ...config };
                        const cleanDomain = domain.trim();
                        newConfig.add = cleanDomain;
                        newConfig.ps = (config.ps || '节点') + ' - ' + cleanDomain;
                        return { domain: cleanDomain, vmess: encodeVmess(newConfig) };
                    });
                    setGeneratedNodes(nodes);

                    // --- 关键修改：请求自己 Worker 内部的代理接口，彻底解决跨域 ---
                    const uuid = self.crypto.randomUUID();
                    const longUrl = API_BASE_PLACEHOLDER + '/singbox?config=' + encodeURIComponent(nodes.map(n => n.vmess).join('\\n')) + '&ua=&selectedRules=%22comprehensive%22&customRules=%5B%5D';
                    
                    const proxyUrl = "/api/shorten?url=" + encodeURIComponent(longUrl) + "&shortCode=" + uuid;
                    
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        setShortUrl(API_BASE_PLACEHOLDER + '/s/' + uuid);
                        setCopyFeedback('订阅地址已就绪');
                    } else {
                        throw new Error('代理接口请求失败');
                    }
                } catch (e) {
                    setError('生成失败: ' + e.message);
                } finally {
                    setIsGenerating(false);
                }
            };

            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 pb-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8 pt-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="w-8 h-8 text-indigo-600" />
                                <h1 className="text-4xl font-bold text-gray-800 tracking-tight">VMess 订阅生成器 Pro</h1>
                            </div>
                            <p className="text-gray-600">批量生成优选节点并自动转换 Sing-box 短链接订阅</p>
                        </div>
                        {copyFeedback && (
                            <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-bounce">
                                {copyFeedback}
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">原始 VMess 节点</label>
                            <textarea
                                value={originalVmess}
                                onChange={(e) => setOriginalVmess(e.target.value)}
                                placeholder="粘贴 vmess:// 链接..."
                                className="w-full h-28 px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:outline-none transition-all resize-none font-mono text-sm bg-gray-50"
                            />
                        </div>
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">优选域名配置</label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setUsePresetDomains(!usePresetDomains); if(!usePresetDomains) setDomains(['']); }}
                                            className={"px-3 py-1.5 rounded-lg text-sm font-bold transition-all " + (usePresetDomains ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100')}>
                                        {usePresetDomains ? '✓ 已用内置' : '⚡ 使用内置'}
                                    </button>
                                    {!usePresetDomains && (
                                        <button onClick={() => setDomains([...domains, ''])} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-bold border border-gray-200">
                                            <Plus className="w-4 h-4" /> 添加
                                        </button>
                                    )}
                                </div>
                            </div>
                            {usePresetDomains ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    {PRESET_DOMAINS.map((d, i) => <div key={i} className="bg-white px-3 py-2 rounded-lg text-xs font-mono text-gray-600 border border-indigo-100 text-center">{d}</div>)}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {domains.map((domain, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={domain}
                                                onChange={(e) => {
                                                    const d = [...domains];
                                                    d[index] = e.target.value;
                                                    setDomains(d);
                                                }}
                                                placeholder="例如: mfa.gov.ua"
                                                className="flex-1 px-4 py-2.5 border-2 border-gray-50 rounded-xl focus:border-indigo-500 focus:outline-none transition-all"
                                            />
                                            {domains.length > 1 && (
                                                <button onClick={() => setDomains(domains.filter((_, i) => i !== index))} className="px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100"><X className="w-5 h-5" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl shadow-sm">
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}
                        <button
                            onClick={generateAndShorten}
                            disabled={isGenerating}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                        >
                            {isGenerating ? '正在拼命生成中...' : '立即生成订阅地址'}
                        </button>
                        {shortUrl && (
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-8 mb-8 text-white animate-fade-in relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">订阅地址已就绪</h2>
                                        <button
                                            onClick={() => copyToClipboard(shortUrl, '订阅链接已复制')}
                                            className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                                        >
                                            复制链接
                                        </button>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/20 break-all font-mono text-sm backdrop-blur-sm">
                                        {shortUrl}
                                    </div>
                                    <p className="text-xs mt-4 text-indigo-100 font-medium">
                                        该请求通过 Worker 代理转发，已成功解决跨域限制。
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            </div>
                        )}
                        {generatedNodes.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">预览生成的节点 ({generatedNodes.length})</h2>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {generatedNodes.map((node, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-mono font-bold text-indigo-600 truncate mr-4">{node.domain}</span>
                                            <button onClick={() => copyToClipboard(node.vmess, '节点已复制')} className="text-gray-400 hover:text-indigo-600"><Copy className="w-4 h-4" /></button>
                                        </div>
                                    ))}
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
