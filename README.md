# Swipy - Modern Mobile App UI

A sophisticated, modern mobile application UI designed for iOS/Android that serves as a Tinder-like platform for startups, team members, and investors with beautiful swipe interactions. **Now available as separate HTML files for easy Figma import!**

## 🚀 Features

### Core Functionality
- **Onboarding Experience**: 3 beautiful onboarding screens with floating animations
- **Authentication**: Modern login/signup interface with glassmorphic effects
- **Swipe Interface**: Tinder-like card swiping with 3D effects and realistic physics
- **Smart Filtering**: Advanced filtering system for startups and opportunities
- **Startup Management**: Multi-step form for adding new startups
- **Chat System**: Modern messaging interface with typing indicators
- **User Profiles**: Comprehensive user profiles with skills and preferences
- **Notifications**: Real-time notification system
- **Settings**: User preferences and app configuration

### Design Features
- **Dark Theme**: Elegant dark color scheme (#1C1C1E background)
- **Glassmorphism**: Modern glass-like effects with backdrop blur
- **Smooth Animations**: 60fps animations with cubic-bezier easing
- **3D Effects**: Realistic card swiping with rotation and scaling
- **Micro-interactions**: Subtle hover effects and feedback animations
- **Modern Icons**: Font Awesome 6.4.0 icon set (no emojis)
- **Responsive Design**: Optimized for mobile devices (375x812px)

## 📱 Available Screens (Separate HTML Files)

### 1. **`index.html`** - Welcome Page
- Landing page with app introduction
- Feature highlights and call-to-action buttons
- Responsive design for all devices

### 2. **`onboarding.html`** - Onboarding Screen 1
- Welcome screen with rocket icon
- Floating element animations
- Progress indicators

### 3. **`onboarding2.html`** - Onboarding Screen 2
- Team building focus
- Users icon and animations
- Navigation between screens

### 4. **`onboarding3.html`** - Onboarding Screen 3
- Funding and growth focus
- Lightbulb icon and animations
- Final onboarding step

### 5. **`login.html`** - Authentication Screen
- Clean login form with icon inputs
- Social login options
- Gradient logo and branding

### 6. **`main.html`** - Main Swipe Interface
- Full-screen startup cards
- 3D swipe animations
- Action buttons and card stack

### 7. **`filters.html`** - Search & Filters
- Industry and stage selection
- Location and role filtering
- Interactive tag system

### 8. **`add.html`** - Add Startup Form
- Multi-step form wizard
- Progress indicators
- Form validation and upload areas

### 9. **`chat.html`** - Chat List
- Chat conversations list
- Unread indicators
- User avatars and badges

### 10. **`chatDetail.html`** - Individual Chat
- Message bubbles and typing indicators
- Chat input with attachments
- Real-time messaging simulation

### 11. **`profile.html`** - User Profile
- Profile avatar and information
- Skills and experience display
- Action buttons for profile management

### 12. **`notifications.html`** - Notifications
- Real-time notification list
- Unread/read status
- Action buttons for management

### 13. **`settings.html`** - App Settings
- Appearance and notification preferences
- Account management options
- Support and help sections

## 🎨 Design System

### Color Palette
- **Primary Background**: #1C1C1E (Dark Gray)
- **Secondary Background**: #2C2C2E (Medium Gray)
- **Accent Primary**: #0A84FF (Bright Blue)
- **Accent Secondary**: #32D74B (Green)
- **Text Primary**: #FFFFFF (White)
- **Text Secondary**: #AEAEB2 (Light Gray)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900
- **Scale**: Modular scale with consistent spacing

### Spacing & Layout
- **Grid System**: 8px base unit
- **Border Radius**: 12-24px for modern feel
- **Shadows**: Multiple shadow levels for depth
- **Padding**: Consistent 20px, 24px, 32px spacing

## 🛠️ Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup for each screen
- **CSS3**: Modern CSS with custom properties
- **JavaScript ES6+**: Vanilla JS with modern syntax
- **Font Awesome**: Professional icon library
- **Google Fonts**: Inter font family

### Animation System
- **CSS Transitions**: Smooth state changes
- **CSS Animations**: Keyframe animations
- **JavaScript Animations**: Interactive animations
- **3D Transforms**: Card rotation and scaling
- **Spring Physics**: Realistic motion

### Performance Features
- **Hardware Acceleration**: GPU-accelerated animations
- **Efficient Selectors**: Optimized CSS
- **Event Delegation**: Smart event handling
- **Lazy Loading**: On-demand content loading

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Safari, Firefox)
- Local web server (optional, for development)

### Installation
1. Clone or download the project files
2. Open any HTML file in a web browser
3. Or serve files using a local web server

### File Structure
```
NextVentures/
├── index.html              # Welcome page
├── onboarding.html         # Onboarding screen 1
├── onboarding2.html        # Onboarding screen 2
├── onboarding3.html        # Onboarding screen 3
├── login.html              # Authentication
├── main.html               # Main swipe interface
├── filters.html            # Search and filters
├── add.html                # Add startup form
├── chat.html               # Chat list
├── chatDetail.html         # Individual chat
├── profile.html            # User profile
├── notifications.html      # Notifications
├── settings.html           # App settings
├── styles.css              # Complete CSS styling
├── script.js               # JavaScript functionality
└── README.md               # This file
```

## 🎯 Figma Import Instructions

### For Individual Screens:
1. Open the specific HTML file you want to import
2. Copy the entire HTML content
3. Use Figma's HTML to Figma plugin
4. The plugin will now capture the complete screen content

### For Complete App:
1. Import each HTML file separately
2. Each file represents a complete, standalone screen
3. All screens use the same `styles.css` and `script.js`
4. Maintain consistent design across all screens

## 🎯 Usage

### Navigation
- **Direct Links**: Each HTML file can be opened independently
- **Cross-Navigation**: Use the navigation buttons within each screen
- **Bottom Navigation**: Consistent 5-section navigation across screens

### Interactions
- **Card Swiping**: Drag cards left/right (in main.html)
- **Filter Selection**: Tap tags to toggle (in filters.html)
- **Form Input**: Type in form fields (in add.html)
- **Button Feedback**: Visual feedback on actions

## 🔧 Customization

### Colors
Modify CSS custom properties in `:root` section:
```css
:root {
    --bg-primary: #1C1C1E;
    --accent-primary: #0A84FF;
    /* Add your custom colors */
}
```

### Animations
Adjust animation timing and easing:
```css
transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Content
Update startup data in `script.js`:
```javascript
const startups = [
    {
        name: "Your Startup",
        category: "Your Category",
        // Add more properties
    }
];
```

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices
- **Breakpoints**: Responsive adjustments
- **Touch Friendly**: Optimized for touch interactions
- **Viewport**: Proper mobile viewport settings

## 🌟 Advanced Features

### 3D Card Effects
- Realistic rotation based on swipe direction
- Dynamic scaling and opacity
- Smooth spring-back animations
- Visual feedback indicators

### Micro-interactions
- Button hover effects
- Input focus states
- Loading animations
- Success/error feedback

### Performance Optimizations
- Efficient DOM manipulation
- Optimized event listeners
- Smooth 60fps animations
- Memory-efficient card generation

## 🔮 Future Enhancements

- **Backend Integration**: API connectivity
- **Real-time Chat**: WebSocket implementation
- **Push Notifications**: Native notification support
- **Offline Support**: Service worker implementation
- **Analytics**: User behavior tracking
- **A/B Testing**: UI optimization framework

## 📄 License

This project is created for educational and demonstration purposes. Feel free to use and modify for your own projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For questions or support, please open an issue in the project repository.

---

**NextVentures** - Connecting startups with talent, investors, and opportunities through modern mobile technology.

## 🎨 Figma Import Tips

### Best Practices:
1. **Import screens individually** for best results
2. **Use the same CSS file** to maintain consistency
3. **Test interactions** after import
4. **Adjust viewport** to mobile dimensions (375x812px)

### Common Issues:
- **Missing styles**: Ensure `styles.css` is accessible
- **Font loading**: Google Fonts may need time to load
- **Icon display**: Font Awesome icons require internet connection
- **Responsive behavior**: Test on different screen sizes
