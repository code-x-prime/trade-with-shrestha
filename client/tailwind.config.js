/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				gold: {
					DEFAULT: '#B45309',
					light: '#F0C040',
					dark: '#D4AF37',
				},
				brand: {
					'50': '#fff9eb',
					'100': '#fff1cf',
					'200': '#ffe39f',
					'300': '#ffd46f',
					'400': '#f7c24b',
					'500': '#d4a63a',
					'600': '#b98824',
					'700': '#8f6818',
					'800': '#664812',
					'900': '#3d2a0b',
					DEFAULT: '#d4a63a',
					dark: '#0A0A0A',
					card: '#111111',
				},
				hero: {
					primary: '#b98824',
					secondary: '#d4a63a',
					accent: '#f7c24b',
					gradient: {
						from: '#8f6818',
						to: '#d4a63a',
						via: '#b98824'
					}
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				float: {
					'0%, 100%': {
						transform: 'translate(0, 0) rotate(0deg)'
					},
					'25%': {
						transform: 'translate(20px, -25px) rotate(5deg)'
					},
					'50%': {
						transform: 'translate(-15px, 15px) rotate(-5deg)'
					},
					'75%': {
						transform: 'translate(25px, -20px) rotate(3deg)'
					}
				},
				'float-reverse': {
					'0%, 100%': {
						transform: 'translate(0, 0) rotate(0deg)'
					},
					'25%': {
						transform: 'translate(-20px, 25px) rotate(-5deg)'
					},
					'50%': {
						transform: 'translate(15px, -15px) rotate(5deg)'
					},
					'75%': {
						transform: 'translate(-25px, 20px) rotate(-3deg)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 20s ease-in-out infinite',
				'float-reverse': 'float-reverse 25s ease-in-out infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
