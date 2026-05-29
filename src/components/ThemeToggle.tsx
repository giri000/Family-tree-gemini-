import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial
    const isDarkGlobal = document.documentElement.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !('theme' in localStorage));
    
    if (localStorage.getItem('theme') === 'dark' || isDarkGlobal) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return { isDark, toggleTheme };
}

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100/85 dark:hover:bg-slate-800/85 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs hover:shadow-md cursor-pointer select-none active:scale-95"
      title="Toggle Dark Mode"
    >
      {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  );
}
