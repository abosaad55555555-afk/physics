// js/vector.js - الكود النهائي والمصحح

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const inputs = {
        magA: document.getElementById('magA'), angleA: document.getElementById('angleA'),
        magB: document.getElementById('magB'), angleB: document.getElementById('angleB')
    };
    const calculateButton = document.getElementById('calculateButton');

    function drawArrow(startX, startY, endX, endY, color, text) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 10;
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(text, (startX + endX) / 2, (startY + endY) / 2 - 5);
        return { endX, endY };
    }
    
    const calculateAndDraw = () => {
        document.getElementById('magA-val').innerText = inputs.magA.value;
        document.getElementById('angleA-val').innerText = inputs.angleA.value;
        document.getElementById('magB-val').innerText = inputs.magB.value;
        document.getElementById('angleB-val').innerText = inputs.angleB.value;
        
        const magA = parseFloat(inputs.magA.value);
        const angleA = parseFloat(inputs.angleA.value);
        const magB = parseFloat(inputs.magB.value);
        const angleB = parseFloat(inputs.angleB.value);

        const angleARad = angleA * (Math.PI / 180);
        const angleBRad = angleB * (Math.PI / 180);
        const Rx = magA * Math.cos(angleARad) + magB * Math.cos(angleBRad);
        const Ry = magA * Math.sin(angleARad) + magB * Math.sin(angleBRad);
        const magR = Math.sqrt(Rx * Rx + Ry * Ry);
        let angleR = Math.atan2(Ry, Rx) * (180 / Math.PI);
        if (angleR < 0) angleR += 360; 
        
        document.getElementById('magR').innerText = magR.toFixed(2);
        document.getElementById('angleR').innerText = angleR.toFixed(2);

        // --- الرسم ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(0, centerY); ctx.lineTo(canvas.width, centerY); 
        ctx.moveTo(centerX, 0); ctx.lineTo(centerX, canvas.height); ctx.stroke();

        const maxMag = Math.max(magR, magA, magB);
        const SCALE = (canvas.width / 2) / maxMag * 0.8;
        
        const drawVectorHelper = (mag, angleDeg, color, startX, startY, label) => {
            const angleRad = angleDeg * (Math.PI / 180);
            const len = mag * SCALE;
            const endX = startX + len * Math.cos(angleRad);
            const endY = startY - len * Math.sin(angleRad); 
            return drawArrow(startX, startY, endX, endY, color, label);
        };

        const endA = drawVectorHelper(magA, angleA, '#007bff', centerX, centerY, 'A');
        drawVectorHelper(magB, angleB, '#28a745', endA.endX, endA.endY, 'B'); 
        drawVectorHelper(magR, angleR, '#dc3545', centerX, centerY, 'R');
    };

    // --- الربط الحاسم للأحداث ---
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', calculateAndDraw);
    });
    calculateButton.addEventListener('click', calculateAndDraw);

    calculateAndDraw();
});