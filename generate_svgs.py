import os

svg_dir = os.path.join(os.path.dirname(__file__), "static", "images")
os.makedirs(svg_dir, exist_ok=True)

def make_product_svg(title, subtitle, color, badge, icon_symbol):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_{badge}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="400" height="400" rx="28" fill="url(#grad_{badge})"/>
  <rect x="16" y="16" width="368" height="368" rx="20" fill="none" stroke="{color}" stroke-width="2" stroke-dasharray="6 6" opacity="0.4"/>
  
  <!-- Product Canister / Bottle -->
  <g filter="url(#shadow)" transform="translate(100, 40)">
    <!-- Cap -->
    <rect x="65" y="15" width="70" height="28" rx="6" fill="#1e293b"/>
    <rect x="75" y="6" width="50" height="12" rx="3" fill="#334155"/>
    
    <!-- Bottle Body -->
    <rect x="30" y="43" width="140" height="235" rx="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
    
    <!-- Header Banner -->
    <path d="M30 80 Q100 70 170 80 L170 145 Q100 155 30 145 Z" fill="{color}"/>
    <text x="100" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">{badge}</text>
    
    <!-- Center Seal -->
    <circle cx="100" cy="190" r="30" fill="{color}" opacity="0.15"/>
    <circle cx="100" cy="190" r="22" fill="{color}"/>
    <text x="100" y="198" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">{icon_symbol}</text>
    
    <!-- Chemical label bar -->
    <rect x="42" y="240" width="116" height="24" rx="5" fill="#f1f5f9"/>
    <text x="100" y="256" font-family="monospace" font-size="10" font-weight="bold" fill="#475569" text-anchor="middle">PJTSAU VERIFIED</text>
  </g>
  
  <!-- Bottom Text Description -->
  <text x="200" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#0f172a" text-anchor="middle">{title}</text>
  <text x="200" y="348" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">{subtitle}</text>
  <text x="200" y="372" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="{color}" text-anchor="middle">Certified Agricultural Grade</text>
</svg>"""

products = [
    ('copper_oxychloride.svg', 'Copper Oxychloride 50 WP', 'Blitox / Cupramar Bactericide', '#0284c7', 'BLITOX', 'CU'),
    ('carbendazim.svg', 'Carbendazim 50% WP', 'Bavistin Systemic Fungicide', '#059669', 'BAVISTIN', 'CB'),
    ('neem_oil.svg', 'Neem Oil 10,000 PPM', 'Cold-Pressed Bio-Pesticide', '#16a34a', 'NEEM', 'NO'),
    ('streptocycline.svg', 'Streptocycline 90:10', 'Agricultural Antibiotic', '#dc2626', 'STREPTO', 'ST'),
    ('mancozeb.svg', 'Mancozeb 75% WP', 'Dithane M-45 Broad Spectrum', '#d97706', 'DITHANE', 'MZ'),
    ('healthy_crop.svg', 'Bio-NPK & Micronutrients', 'Organic Plant Health Booster', '#15803d', 'HEALTHY', 'OK'),
    ('chlorpyrifos.svg', 'Chlorpyrifos 20% EC', 'Broad Spectrum Pest Ingestion', '#ea580c', 'CHLOR', 'CP'),
    ('propargite.svg', 'Propargite 57% EC', 'Acaricide for Mites and Rusts', '#9333ea', 'PROPAR', 'PR'),
    ('imidacloprid.svg', 'Imidacloprid 17.8% SL', 'Systemic Sucking Pest Protector', '#0284c7', 'CONFIDOR', 'IM'),
    ('bordeaux_mixture.svg', 'Bordeaux Mixture 1%', 'Copper Sulfate and Slaked Lime', '#2563eb', 'BORDEAUX', 'BM')
]

for filename, title, sub, col, badge, icon in products:
    content = make_product_svg(title, sub, col, badge, icon)
    filepath = os.path.join(svg_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created {filename}")

print("All product SVG images generated successfully!")
