import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
			fontFamily: {
				// Typography Pairing 1: Inter + Source Serif Pro
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'source-serif': ['Source Serif 4', 'Georgia', 'serif'],
				// Typography Pairing 2: IBM Plex Sans + Lora  
				'ibm-plex': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
				'lora': ['Lora', 'Georgia', 'serif'],
				// Typography Pairing 3: Libre Franklin + Crimson Pro
				'libre-franklin': ['Libre Franklin', 'system-ui', 'sans-serif'],
				'crimson': ['Crimson Pro', 'Georgia', 'serif'],
				// Typography Pairing 4: Source Sans 3 + Merriweather
				'source-sans-3': ['Source Sans 3', 'system-ui', 'sans-serif'],
				'merriweather': ['Merriweather', 'Georgia', 'serif'],
				// Typography Pairing 5: Manrope + Spectral
				'manrope': ['Manrope', 'system-ui', 'sans-serif'],
				'spectral': ['Spectral', 'Georgia', 'serif'],
				// Typography Pairing 6: Plus Jakarta Sans + Lora
				'plus-jakarta': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
				// Typography Pairing 7: Playfair Display + Inter (Editorial)
				'playfair': ['Playfair Display', 'Georgia', 'serif'],
			},
			fontSize: {
				// Template Typography Scale
				'template-caption': ['0.75rem', { lineHeight: '1.35' }], // 12px
				'template-body': ['0.875rem', { lineHeight: '1.5' }],    // 14px  
				'template-h3': ['1rem', { lineHeight: '1.35' }],         // 16px
				'template-h2': ['1.375rem', { lineHeight: '1.3' }],      // 22px
				'template-h1': ['2.25rem', { lineHeight: '1.2' }],       // 36px
				'template-quote': ['1.125rem', { lineHeight: '1.45' }],  // 18px
			},
			spacing: {
				// Template Spacing Scale - 12pt baseline
				'template-xs': '0.25rem',   // 4px
				'template-sm': '0.5rem',    // 8px  
				'template-base': '0.75rem', // 12px (baseline)
				'template-md': '1rem',      // 16px
				'template-lg': '1.5rem',    // 24px
				'template-xl': '2rem',      // 32px
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-muted': 'var(--gradient-muted)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'glow': 'var(--shadow-glow)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)'
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
