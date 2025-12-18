// Border - Performance Corridor Experience
// Inspired by Bruce Nauman's Performance Corridor

let video, canvas, ctx;
let model;
let isRunning = false;
let animationId;

// Configuration
const config = {
    minScale: 0.2,      // Minimum scale when very close
    maxScale: 2.0,      // Maximum scale when far away
    baseDistance: 300,  // Reference distance for scaling calculations
    updateInterval: 100 // ms between detection updates
};

// Initialize the application
async function init() {
    video = document.getElementById('webcam');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('startButton').addEventListener('click', start);
    document.getElementById('stopButton').addEventListener('click', stop);
    
    updateStatus('Ready to start');
}

// Start the experience
async function start() {
    try {
        updateStatus('Requesting camera access...');
        
        // Request webcam access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        video.srcObject = stream;
        await video.play();
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        updateStatus('Loading AI model...');
        
        // Load COCO-SSD model for person detection
        model = await cocoSsd.load();
        
        updateStatus('Model loaded. Detecting...');
        
        isRunning = true;
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        
        // Start detection loop
        detectAndDisplay();
        
    } catch (error) {
        console.error('Error starting experience:', error);
        updateStatus('Error: ' + error.message);
        alert('Unable to access webcam. Please ensure you have granted camera permissions.');
    }
}

// Stop the experience
function stop() {
    isRunning = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
    
    updateStatus('Stopped');
    updateDistance('--');
    updateScale('--');
}

// Main detection and display loop
async function detectAndDisplay() {
    if (!isRunning) return;
    
    try {
        // Detect objects in the current frame
        const predictions = await model.detect(video);
        
        // Filter for person detections
        const people = predictions.filter(pred => pred.class === 'person');
        
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
            const normalizedHeight = personHeight / canvas.height;
            
            // Calculate scale inversely proportional to distance
            // When person is close (large bbox), scale is small
            // When person is far (small bbox), scale is large
            const scale = calculateInverseScale(normalizedHeight);
            
            // Draw the shoe region with inverse scaling
            drawShoeRegion(shoeRegion, scale);
            
            // Update UI
            updateStatus('Person detected - Tracking shoes');
            updateDistance((normalizedHeight * 100).toFixed(1) + '%');
            updateScale(scale.toFixed(2) + 'x');
            
        } else {
            // No person detected - show full video feed at normal scale
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            updateStatus('Waiting for person...');
            updateDistance('--');
            updateScale('1.00x');
        }
        
    } catch (error) {
        console.error('Detection error:', error);
    }
    
    // Schedule next detection
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
    
    // Add a subtle fade effect to edges
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    
    // Draw the extracted shoe region
    ctx.drawImage(
        video,
        region.x, region.y, region.width, region.height,  // Source region
        centerX, centerY, scaledWidth, scaledHeight        // Destination with scale
    );
    
    // Optional: Draw a border around the shoe region for clarity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX, centerY, scaledWidth, scaledHeight);
    
    ctx.restore();
}

// Update status message
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Update distance display
function updateDistance(value) {
    document.getElementById('distance').textContent = 'Distance: ' + value;
}

// Update scale display
function updateScale(value) {
    document.getElementById('scale').textContent = 'Scale: ' + value;
}

// Initialize on page load
window.addEventListener('load', init);
