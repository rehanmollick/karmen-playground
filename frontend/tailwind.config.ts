import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-pink": "var(--accent-pink)",
        "accent-pink-light": "var(--accent-pink-light)",
        "blue-primary": "var(--blue-primary)",
        "blue-hover": "var(--blue-hover)",
        "blue-light": "var(--blue-light)",
        "blue-muted": "var(--blue-muted)",
        "export-red": "var(--export-red)",
        "critical-red": "var(--critical-red)",
        "success-green": "var(--success-green)",
        "warning-amber": "var(--warning-amber)",
        "gantt-bar": "var(--gantt-bar)",
        "fragnet-new": "var(--fragnet-new)",
        "fragnet-modified": "var(--fragnet-modified)",
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
