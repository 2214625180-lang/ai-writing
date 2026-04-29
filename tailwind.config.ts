import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#0F172A",
        background: "#F8FAFC",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC"
        },
        secondary: {
          DEFAULT: "#E2E8F0",
          foreground: "#0F172A"
        },
        muted: {
          DEFAULT: "#EEF2FF",
          foreground: "#475569"
        },
        accent: {
          DEFAULT: "#DBEAFE",
          foreground: "#1E3A8A"
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A"
        }
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem"
      },
      boxShadow: {
        soft: "0 20px 45px -24px rgba(15, 23, 42, 0.24)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(15, 23, 42, 0.08), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
