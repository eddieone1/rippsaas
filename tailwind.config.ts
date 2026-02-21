import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        rip: {
          bg: "#1F2121",
          "bg-2": "#2F3131",
          black: "#0B0B0B",
          accent: "#9EFF00",
        },
      },
    },
  },
  plugins: [],
};
export default config;
