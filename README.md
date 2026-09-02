# Zack Tippett Website

A cutting-edge, immersive website for Zachariah Tippett - stand-up comedian, activist, and Tourette's Syndrome advocate.

## Features

### Visual Design
- **Dark theme** with high-contrast typography (minimum 600 weight)
- **Scroll-triggered line art animations** with teal ribbons for Tourette's awareness
- **GSAP-powered animations** with pinned sections and smooth transitions
- **Paper grain texture overlay** for editorial feel
- **Polaroid-style photo frames** with shadow effects

### Sections
1. **Hero** - Video gallery with brand introduction
2. **About + Shows** - Two-column layout with bio and upcoming shows
3. **Video Reel** - Featured performance section
4. **Products** - 8 apparel items + accessories (linked to Printful)
5. **Support/Donate** - Cash App and Patreon integration
6. **Closing** - Social links and contact

### eCommerce
- 8 products with variants (Men's T-Shirt, Women's T-Shirt, Unisex Sweater)
- Shopping cart functionality
- Printful integration for fulfillment
- "Other Stuff" section (stickers, mugs, pins, tote bags)

### Hidden Admin Dashboard

#### Access Methods
1. **Keyboard Shortcut**: Hold `Ctrl` + `Tab` + `Down Arrow` together
2. **Direct Link**: Navigate to site and use login modal

#### Default Credentials
- **Username**: `admin`
- **Password**: generated on first server run and printed once to the server log (or set via `ADMIN_DEFAULT_PASSWORD`)

#### Admin Features
- **Shows Management**: Add, edit, delete upcoming shows
- **Video Gallery**: Manage video embeds
- **Donation Tracking**: View donation history
- **Credential Settings**: Change username and password

#### Changing Admin Credentials
1. Access admin dashboard
2. Go to "Settings" tab
3. Enter new username and password
4. Click "Save Changes"

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: GSAP + ScrollTrigger
- **Icons**: Lucide React

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

The site is built to the `dist/` folder and can be deployed to any static hosting service.

## Donations

Cash App Tag: `$TourettesInc`

## Contact

Email: tourettesinc@gmail.com <!-- TODO: update to Zack's new contact email/cashapp when ready -->
Location: San Antonio, Texas

---

Built with ❤️ for Tourette's awareness through comedy.
