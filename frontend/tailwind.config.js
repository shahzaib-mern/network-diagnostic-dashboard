/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Orbitron"', 'monospace'],
      },
      colors: {
        bg: '#0a0e1a',
        surface: '#0f1628',
        panel: '#141c35',
        border: '#1e2d5a',
        accent: '#00d4ff',
        accent2: '#7c3aed',
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff3366',
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#475569',
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.15)',
        'glow-danger': '0 0 20px rgba(255, 51, 102, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'fadeIn': 'fadeIn 0.4s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
