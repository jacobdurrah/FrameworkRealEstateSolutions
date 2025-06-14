# Framework Real Estate Solutions Website

A minimal, professional website for Framework Real Estate Solutions - providing quality affordable housing in Detroit.

## Overview

This website is designed to be:
- Mobile-first and fully responsive
- Accessible (WCAG 2.1 AA compliant)
- Fast loading (optimized for performance)
- SEO-friendly
- Section 8 housing focused

## Setup Instructions

### Quick Start

1. **Clone or download the website files** to your local machine
2. **No build process required** - this is a static HTML website
3. **Open `index.html`** in a web browser to view the site locally

### Deployment

#### Option 1: Simple Hosting (Recommended for MVP)
- Upload all files to any web hosting service
- Services like Netlify, Vercel, or GitHub Pages offer free hosting
- Ensure the folder structure is maintained

#### Option 2: Local Development
```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## File Structure

```
website/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # All styles
├── js/
│   └── main.js        # JavaScript functionality
├── images/
│   └── logo.svg       # Company logo
└── README.md          # This file
```

## Customization

### Update Contact Information
1. Replace `(313) XXX-XXXX` with actual phone number in:
   - `index.html` (multiple locations)
   - Update WhatsApp links: `https://wa.me/1313XXXXXXX`

### Add Property Images
1. Add property photos to the `images/` folder
2. Name them: `property-1.jpg`, `property-2.jpg`, etc.
3. Recommended size: 800x600px, optimized for web

### Update Property Listings
1. Edit the property cards in `index.html`
2. Update addresses, bedroom/bathroom counts, and rent prices
3. Ensure rents align with Section 8 FMR limits

### Modify Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-dark: #3a3a3a;
    --accent-green: #4a7c59;
    /* etc. */
}
```

## Features

- **WhatsApp Integration**: Click-to-chat functionality
- **Property Inquiries**: Direct WhatsApp messages for each property
- **Contact Form**: Email-based contact (requires email client)
- **Responsive Design**: Works on all devices
- **Accessibility**: Screen reader friendly, keyboard navigation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance Tips

1. **Optimize Images**: 
   - Use JPG for photos (80% quality)
   - Keep images under 200KB each
   - Use correct dimensions (800x600px for property photos)

2. **Enable Compression**: 
   - Most hosting services do this automatically
   - Enable gzip/brotli if available

3. **Use CDN**: 
   - Consider using a CDN for better performance
   - Cloudflare offers free CDN services

## Future Enhancements

- Add real property photos
- Implement server-side form handling
- Add Google Analytics
- Create separate pages for Privacy Policy and Fair Housing
- Add more properties as they become available
- Integrate with property management system

## Support

For questions or updates, contact Framework Real Estate Solutions.

---

Built with ❤️ for Detroit's affordable housing mission.