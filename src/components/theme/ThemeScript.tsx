export function ThemeScript() {
  const code = `(() => {
    try {
      const stored = localStorage.getItem('dueviq-theme');
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored ? stored === 'dark' : prefers;
      if (isDark) document.documentElement.classList.add('dark');
    } catch (e) {}
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
