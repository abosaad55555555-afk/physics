// js/projectile.js - «·ﬂÊœ «·‰Â«∆Ì Ê«·„’ÕÕ

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('projectileCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = 9.8; 

    const velInput = document.getElementById('initial-velocity');
    const angleInput = document.getElementById('launch-angle');
    const runButton = document.getElementById('runButton');

    const calculateAndDraw = () => {
        const v0 = parseFloat(velInput.value);
        const angleDeg = parseFloat(angleInput.value);
        const angleRad = angleDeg * (Math.PI / 180);

        document.getElementById('vel-value').innerText = v0;
        document.getElementById('angle-value').innerText = angleDeg;

        const tFlight = (2 * v0 * Math.sin(angleRad)) / g;
        const xMax = (Math.pow(v0, 2) * Math.sin(2 * angleRad)) / g;
        const yMax = (Math.pow(v0, 2) * Math.pow(Math.sin(angleRad), 2)) / (2 * g);
        
        document.getElementById('tflight').innerText = tFlight.toFixed(2);
        document.getElementById('ymax').innerText = yMax.toFixed(2);
        document.getElementById('xmax').innerText = xMax.toFixed(2);

        // --- «·—”„ ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const padding = 20;
        const availableWidth = canvas.width - 2 * padding;
        const availableHeight = canvas.height - 2 * padding;
        
        const scale = Math.min(
            availableWidth / (xMax || 1), 
            availableHeight / (yMax * 2 || 1) 
        );
        
        const originX = padding;
        const originY = canvas.height - padding; 

        ctx.beginPath();
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 3;
        
        let t = 0;
        const dt = tFlight / 100;

        while (t <= tFlight) {
            const x = v0 * Math.cos(angleRad) * t;
            const y = v0 * Math.sin(angleRad) * t - 0.5 * g * Math.pow(t, 2);
            
            const canvasX = originX + (x * scale);
            const canvasY = originY - (y * scale); 

            if (t === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
            t += dt;
        }
        ctx.stroke();

        ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();
    };

    // --- «·—»ÿ «·Õ«”„ ··√Õœ«À ---
    [velInput, angleInput].forEach(input => {
        input.addEventListener('input', calculateAndDraw);
    });
    runButton.addEventListener('click', calculateAndDraw);

    calculateAndDraw();
});