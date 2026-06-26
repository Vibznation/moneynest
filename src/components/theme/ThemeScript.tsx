import Script from "next/script";

export function ThemeScript() {
  const code = `(() => {
    try {
      const stored = localStorage.getItem('dueviq:theme') ?? localStorage.getItem('moneynest-theme');
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored ? stored === 'dark' : prefers;
      if (isDark) document.documentElement.classList.add('dark');
    } catch (e) {}
  })();`;
  return <Script id="theme-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
