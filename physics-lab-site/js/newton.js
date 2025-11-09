// js/newton.js - الكود النهائي والمصحح

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('newtonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = 9.8; 
    
    const inputs = {
        mass: document.getElementById('mass-input'),
        force: document.getElementById('applied-force-input'),
        muk: document.getElementById('mu-k-input')
    };
    const startButton = document.getElementById('startButton');

    const outputs = {
        massVal: document.getElementById('mass-value'),
        forceVal: document.getElementById('force-value'),
        mukVal: document.getElementById('muk-value'),
        Ff: document.getElementById('friction-force'),
        Fnet: document.getElementById('net-force'),
        a: document.getElementById('acceleration')
    };

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
    }
    
    function drawForces(m, F_app, F_f, a) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const boxWidth = 100;
        const boxHeight = 50;
        const centerX = canvas.width / 2;
        const baseY = canvas.height * 0.7; 
        const boxCenterY = baseY - boxHeight / 2;

        ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(0, baseY); ctx.lineTo(canvas.width, baseY); ctx.stroke();
        ctx.fillStyle = '#495057';
        ctx.fillRect(centerX - boxWidth / 2, baseY - boxHeight, boxWidth, boxHeight);
        
        const maxForce = Math.max(F_app, m * g, 100); 
        const forceScale = 50 / maxForce; 

        const verticalForceLen = (m * g) * forceScale;
        drawArrow(centerX, boxCenterY, centerX, boxCenterY + verticalForceLen, '#007bff', `Fg=${(m*g).toFixed(1)}N`);
        drawArrow(centerX, boxCenterY, centerX, boxCenterY - verticalForceLen, '#28a745', `FN=${(m*g).toFixed(1)}N`);

        const F_app_length = F_app * forceScale;
        const F_f_length = F_f * forceScale;
        drawArrow(centerX, boxCenterY, centerX + F_app_length, boxCenterY, '#dc3545', `Fapp=${F_app.toFixed(1)}N`);
        drawArrow(centerX, boxCenterY, centerX - F_f_length, boxCenterY, '#ffc107', `Ff=${F_f.toFixed(1)}N`);

        if (a !== 0) {
            const acceleration_length = Math.abs(a) * 30; 
            const endX = centerX + (a > 0 ? acceleration_length : -acceleration_length);
            drawArrow(centerX, boxCenterY - 80, endX, boxCenterY - 80, '#17a2b8', `a=${a.toFixed(2)}m/s²`);
        }
    }

    function calculateAndDrawPhysics() {
        outputs.massVal.innerText = inputs.mass.value;
        outputs.forceVal.innerText = inputs.force.value;
        outputs.mukVal.innerText = parseFloat(inputs.muk.value).toFixed(2);
        
        const m = parseFloat(inputs.mass.value);
        const F_app = parseFloat(inputs.force.value);
        const mu_k = parseFloat(inputs.muk.value);
        
        const F_N = m * g;
        let F_f_max = mu_k * F_N; 
        
        let F_f_actual;
        let F_net;
        let a;

        if (F_app > F_f_max) {
            F_f_actual = F_f_max;
            F_net = F_app - F_f_actual;
            a = F_net / m;
        } else {
            F_f_actual = F_app; 
            F_net = 0;
            a = 0;
        }

        outputs.Ff.innerText = F_f_actual.toFixed(2);
        outputs.Fnet.innerText = F_net.toFixed(2);
        outputs.a.innerText = a.toFixed(2);
        
        drawForces(m, F_app, F_f_actual, a);
    }

    // --- الربط الحاسم للأحداث (يضمن عمل شريط التمرير والزر) ---
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', calculateAndDrawPhysics); 
    });
    startButton.addEventListener('click', calculateAndDrawPhysics);

    calculateAndDrawPhysics(); 
});