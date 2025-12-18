// Border - Performance Corridor Experience
// Inspired by Bruce Nauman's Performance Corridor

let video, canvas, ctx;
let model;
let isRunning = false;
let animationId;
let lastDetectionTime = 0;
let lastPredictions = [];

// Configuration
const config = {
    minScale: 0.2,      // Minimum scale when very close
    maxScale: 2.0,      // Maximum scale when far away
    detectionInterval: 150  // ms between detection runs for performance
};

// Initialize the application
async function init() {
    video = document.getElementById('webcam');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Request fullscreen on any user interaction (required for mobile)
    document.addEventListener('click', requestFullscreen, { once: true });
    document.addEventListener('touchstart', requestFullscreen, { once: true });
    
    // Auto-start the experience
    start();
}

// Request fullscreen mode
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log('Fullscreen request failed:', err));
    } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// Start the experience
async function start() {
    try {
        // Request webcam access with mobile-friendly constraints
        const constraints = {
            video: {
                facingMode: 'user', // Front camera on mobile, any on desktop
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 }
            },
            audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        await video.play();
        
        // Set canvas to fullscreen
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        
        // Load COCO-SSD model for person detection
        model = await cocoSsd.load();
        
        isRunning = true;
        
        // Start detection loop
        detectAndDisplay();
        
    } catch (error) {
        console.error('Error starting experience:', error);
        // Show error on canvas
        resizeCanvas();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Unable to access webcam.', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Please grant camera permissions and reload.', canvas.width / 2, canvas.height / 2 + 10);
    }
}

// Resize canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Prevent screen lock on mobile devices
function keepScreenAwake() {
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(err => {
            console.log('Wake lock request failed:', err);
        });
    }
}

// Main detection and display loop
async function detectAndDisplay() {
    if (!isRunning) return;
    
    const currentTime = Date.now();
    const timeSinceLastDetection = currentTime - lastDetectionTime;
    
    // Run detection at configured interval for performance
    if (timeSinceLastDetection >= config.detectionInterval) {
        try {
            // Detect objects in the current frame
            lastPredictions = await model.detect(video);
            lastDetectionTime = currentTime;
        } catch (error) {
            console.error('Detection error:', error);
        }
    }
    
    // Filter for person detections from last successful detection
    const people = lastPredictions.filter(pred => pred.class === 'person');
    
    if (people.length > 0) {
        // Use the first detected person
        const person = people[0];
        
        // Extract the lower portion (shoes/feet area)
        // We'll focus on the bottom 30% of the person's bounding box
        const bbox = person.bbox;
        const personHeight = bbox[3];
        const lowerPortionHeight = personHeight * 0.3;
        
        // Calculate the shoe region (bottom 30% of person)
        const shoeRegion = {
            x: bbox[0],
            y: bbox[1] + personHeight - lowerPortionHeight,
            width: bbox[2],
            height: lowerPortionHeight
        };
        
        // Estimate distance based on bounding box height
        // Larger height = closer to camera
        // Smaller height = farther from camera
        const videoHeight = video.videoHeight;
        const normalizedHeight = personHeight / videoHeight;
        
        // Calculate scale inversely proportional to distance
        // When person is close (large bbox), scale is small
        // When person is far (small bbox), scale is large
        const scale = calculateInverseScale(normalizedHeight);
        
        // Draw the shoe region with inverse scaling
        drawShoeRegion(shoeRegion, scale);
        
    } else {
        // No person detected - show full video feed at normal scale
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaling to fit video in canvas while maintaining aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (videoAspect > canvasAspect) {
            // Video is wider than canvas
            drawWidth = canvas.width;
            drawHeight = canvas.width / videoAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
        } else {
            // Video is taller than canvas
            drawHeight = canvas.height;
            drawWidth = canvas.height * videoAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
        }
        
        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
    }
    
    // Schedule next frame
    animationId = requestAnimationFrame(detectAndDisplay);
}

// Calculate inverse scale based on normalized height
function calculateInverseScale(normalizedHeight) {
    // normalizedHeight ranges from ~0.1 (far) to ~1.0 (close)
    // We want: far away = large scale, close = small scale
    
    // Inverse relationship with smoothing
    const inverseHeight = 1 - normalizedHeight;
    
    // Map to scale range with a curve for better visual effect
    // Add a base to prevent division by zero and create smooth transition
    const scale = config.minScale + (config.maxScale - config.minScale) * 
                  Math.pow(inverseHeight, 0.7);
    
    // Clamp to min/max values
    return Math.max(config.minScale, Math.min(config.maxScale, scale));
}

// Draw the shoe region with inverse scaling
function drawShoeRegion(region, scale) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scaled dimensions
    const scaledWidth = region.width * scale;
    const scaledHeight = region.height * scale;
    
    // Center the scaled image on canvas
    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;
    
    // Draw the shoe region with scaling
    ctx.save();
    
    // Draw the extracted shoe region
    ctx.drawImage(
        video,
        region.x, region.y, region.width, region.height,  // Source region
        centerX, centerY, scaledWidth, scaledHeight        // Destination with scale
    );
    
    ctx.restore();
}

// Initialize on page load
window.addEventListener('load', () => {
    init();
    keepScreenAwake();
});
