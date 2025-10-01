# Cielonline QR Studio

**QR codes made for you!**

A professional static site for showcasing and hosting QR code solutions, featuring both Hosted Card and Eco vCard options.

## 🌟 Features

- **Marketing Homepage**: Beautiful landing page explaining both QR code types
- **Hosted Cards**: Dynamic web-based digital business cards (cards/\<slug\>/\<slug\>.html)
- **Eco vCards**: Traditional vCard files for instant contact saving (cards/\<slug\>/\<slug\>.vcf)
- **Demo Example**: Carlos Leon's business card demonstrating both formats
- **Mobile Responsive**: Works perfectly on all devices
- **GitHub Pages Ready**: Easy deployment and custom domain support

## 🚀 Publishing to GitHub Pages

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/flyingpenguinx/Cielonline
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source", select:
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`
5. Click **Save**
6. Wait a few minutes for the site to build

Your site will be available at: `https://flyingpenguinx.github.io/Cielonline/`

### Step 2: Configure Custom Domain (https://cielonline.com)

#### A. Add Custom Domain in GitHub

1. In the same **Settings > Pages** section
2. Under "Custom domain", enter: `cielonline.com`
3. Click **Save**
4. Check **Enforce HTTPS** (after DNS propagation)

#### B. Configure DNS Records

Add these DNS records with your domain registrar:

**For root domain (cielonline.com):**
```
Type: A
Name: @
Value: 185.199.108.153
```
```
Type: A
Name: @
Value: 185.199.109.153
```
```
Type: A
Name: @
Value: 185.199.110.153
```
```
Type: A
Name: @
Value: 185.199.111.153
```

**For www subdomain (optional):**
```
Type: CNAME
Name: www
Value: flyingpenguinx.github.io
```

#### C. Verify Custom Domain

1. Wait for DNS propagation (can take 24-48 hours, but often faster)
2. Check DNS propagation: https://www.whatsmydns.net/
3. Once propagated, your site will be available at: https://cielonline.com
4. GitHub will automatically provision an SSL certificate

## 📁 Repository Structure

```
Cielonline/
├── index.html              # Marketing homepage
├── cards/                  # Client cards directory
│   └── carlos-leon/       # Example client (slug: carlos-leon)
│       ├── carlos-leon.html    # Hosted card page
│       └── carlos-leon.vcf     # vCard file for download
├── _config.yml            # GitHub Pages configuration
└── README.md              # This file
```

## 🎨 Adding New Client Cards

To add a new client card, follow the `cards/<slug>/` pattern:

1. Create a new directory: `cards/<client-slug>/`
2. Add HTML file: `cards/<client-slug>/<client-slug>.html`
3. Add vCard file: `cards/<client-slug>/<client-slug>.vcf`
4. Update the homepage if needed to link to the new card

### Example vCard Format

```vcard
BEGIN:VCARD
VERSION:3.0
FN:Full Name
N:LastName;FirstName;;;
ORG:Company Name
TITLE:Job Title
TEL;TYPE=CELL:(123) 456-7890
EMAIL;TYPE=INTERNET:email@example.com
NOTE:Your tagline here
REV:2024-01-01T00:00:00Z
END:VCARD
```

## 🔗 Demo

Visit the demo page for Carlos Leon (Owner & Founder):
- **Hosted Card**: https://cielonline.com/cards/carlos-leon/carlos-leon.html
- **vCard Download**: https://cielonline.com/cards/carlos-leon/carlos-leon.vcf

## 🛠️ Local Development

To test locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/flyingpenguinx/Cielonline.git
   cd Cielonline
   ```

2. Open `index.html` in your browser:
   ```bash
   open index.html  # macOS
   xdg-open index.html  # Linux
   start index.html  # Windows
   ```

   Or use a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

## 📱 QR Code Generation

To create QR codes for your cards:

1. **For Hosted Cards**: Generate QR code pointing to:
   ```
   https://cielonline.com/cards/<slug>/<slug>.html
   ```

2. **For vCards**: Generate QR code pointing to:
   ```
   https://cielonline.com/cards/<slug>/<slug>.vcf
   ```

Recommended QR code generators:
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://goqr.me/

## 📄 License

© 2025 Cielonline. All rights reserved.

## 🤝 Contact

**Carlos Leon**
- Phone: (916) 616-3269
- Email: carloslmgustavo@gmail.com
- Tagline: "QR codes made for you!"
