# Border - Performance Corridor Experience

An interactive audiovisual webcam experience inspired by Bruce Nauman's "Performance Corridor" (1969). This project creates a counterintuitive spatial relationship where proximity reduces visual scale.

## Concept

In Bruce Nauman's original "Performance Corridor," visitors walked down a narrow corridor while being filmed from behind. As they moved deeper into the space, their image on a monitor became smaller, creating a disorienting relationship between physical and perceived space.

This digital interpretation uses computer vision to:
- Detect people through a webcam
- Focus on their lower body (shoes/feet)
- Inversely scale the image based on distance
- Create an immersive fullscreen experience where **closer = smaller** and **farther = larger**

## Features

- 🎥 Real-time webcam video processing
- 🤖 AI-powered person detection using TensorFlow.js
- 👟 Automatic focus on shoe/feet area
- 📏 Inverse distance-to-scale relationship
- 🖼️ Fullscreen immersive display
- 🚀 Auto-start experience
- 🔒 Privacy-first - all processing happens locally in browser

## How It Works

1. The webcam captures fullscreen video of the space
2. TensorFlow.js COCO-SSD model detects people in the frame
3. The system identifies the lower portion of the person's body (shoes area)
4. Distance is estimated based on the size of the detected bounding box
5. The shoe region is displayed fullscreen with inverse scaling:
   - **Close to camera** (large detection) → **Small display**
   - **Far from camera** (small detection) → **Large display**
6. When no person is detected, the full video feed is shown

## Installation & Usage

### Quick Start (Local)

1. Clone the repository:
   ```bash
   git clone https://github.com/madmaxdod/Border.git
   cd Border
   ```

2. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (http-server)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

4. Allow webcam access when prompted - the experience starts automatically

### Requirements

- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Webcam access permission
- HTTPS or localhost (required for webcam access)
- Stable internet connection (for CDN-hosted ML models)

## Technical Details

### Technologies Used

- **HTML5** - Minimal structure with video and canvas elements
- **CSS3** - Fullscreen styling
- **JavaScript (ES6+)** - Application logic and auto-start
- **TensorFlow.js** - Machine learning framework
- **COCO-SSD** - Pre-trained object detection model

### Files

- `index.html` - Minimal HTML structure (video, canvas, scripts)
- `style.css` - Fullscreen styling
- `app.js` - Core application logic with auto-start and detection

### Configuration

You can adjust the behavior by modifying the `config` object in `app.js`:

```javascript
const config = {
    minScale: 0.2,          // Minimum scale when very close
    maxScale: 2.0,          // Maximum scale when far away
    detectionInterval: 150  // ms between detection runs for performance
};
```

## Deployment

### GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select the branch (usually `main`) and root directory
4. Save and wait for deployment
5. Access at `https://yourusername.github.io/Border/`

### Other Hosting Options

The project is purely client-side and can be hosted on:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file hosting service

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Privacy & Security

- All processing happens locally in the browser
- No video data is transmitted or stored
- Webcam access requires explicit user permission
- No external API calls except for loading ML models from CDN

## Artistic Context

Bruce Nauman's "Performance Corridor" explored themes of:
- Surveillance and self-awareness
- Spatial perception and disorientation
- The relationship between viewer and viewed
- Body awareness and physical space

This digital interpretation translates these concepts into an immersive fullscreen web experience, making them accessible to a wider audience while maintaining the core conceptual framework of inverse spatial relationships.

## Troubleshooting

### Camera not working
- Ensure you're accessing via HTTPS or localhost
- Check browser permissions for camera access
- Try refreshing the page
- Check if another application is using the camera

### Performance issues
- Close other browser tabs
- Ensure good lighting for better detection
- Check system resources

### Detection not working
- Ensure adequate lighting
- Move to ensure full body is in frame
- Wait for model to fully load
- Check browser console for errors

## License

MIT License - Feel free to use, modify, and distribute this project.

## Credits

- Inspired by Bruce Nauman's "Performance Corridor" (1969)
- Built with TensorFlow.js and COCO-SSD
- Created for artistic and educational purposes

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your experiences

---

**Note**: This is an artistic project exploring spatial perception and human-computer interaction. The inverse scaling effect is intentional and designed to create a thought-provoking, immersive experience.