// js/app.js - ملف الجافاسكريبت النهائي والموحد

document.addEventListener('DOMContentLoaded', () => {
    // 1. تحديد المحاكي النشط بناءً على وجود عنصر Canvas معين
    
    let currentSimulation = null;
    if (document.getElementById('newtonCanvas')) {
        currentSimulation = 'newton';
    } else if (document.getElementById('projectileCanvas')) {
        currentSimulation = 'projectile';
    } else if (document.getElementById('vectorCanvas')) {
        currentSimulation = 'vector';
    }

    if (!currentSimulation) return; // الخروج إذا لم يكن هناك محاكي نشط (كأن تكون الصفحة الرئيسية)

    // ----------------------------------------------------
    // دالة مساعدة لرسم الأسهم (مُستخدمة في نيوتن والمتجهات)
    // ----------------------------------------------------
    function drawArrow(ctx, startX, startY, endX, endY, color, text) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 10;
        
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLength, headLength / 2);
        ctx.lineTo(-headLength, -headLength / 2);
        ctx.fill();
        ctx.restore();

        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        // لتجنب تداخل النص مع السهم
        ctx.fillText(text, (startX + endX) / 2, (startY + endY) / 2 - 10);
        return { endX, endY };
    }


    // ----------------------------------------------------
    // 2. منطق قوانين نيوتن (الحركة والقوة)
    // ----------------------------------------------------
    if (currentSimulation === 'newton') {
        const canvas = document.getElementById('newtonCanvas');
        const ctx = canvas.getContext('2d');
        const g = 9.8; 
        
        const inputs = {
            mass: document.getElementById('mass-input'),
            force: document.getElementById('applied-force-input'),
            muk: document.getElementById('mu-k-input')
        };
        const updateButton = document.getElementById('updateButton');

        const outputs = {
            massVal: document.getElementById('mass-value'),
            forceVal: document.getElementById('force-value'),
            mukVal: document.getElementById('muk-value'),
            Ff: document.getElementById('friction-force'),
            Fnet: document.getElementById('net-force'),
            a: document.getElementById('acceleration')
        };
        
        function drawForces(m, F_app, F_f, a) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const boxWidth = 100;
            const boxHeight = 50;
            const centerX = canvas.width / 2;
            const baseY = canvas.height * 0.7; 
            const boxCenterY = baseY - boxHeight / 2;

            // رسم السطح
            ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(0, baseY); ctx.lineTo(canvas.width, baseY); ctx.stroke();
            // رسم الصندوق
            ctx.fillStyle = '#495057';
            ctx.fillRect(centerX - boxWidth / 2, baseY - boxHeight, boxWidth, boxHeight);
            
            const maxForce = Math.max(F_app, m * g, 100); 
            const forceScale = 50 / maxForce; 

            // القوى الرأسية
            const verticalForceLen = (m * g) * forceScale;
            drawArrow(ctx, centerX, boxCenterY, centerX, boxCenterY + verticalForceLen, '#007bff', `Fg=${(m*g).toFixed(1)}N`);
            drawArrow(ctx, centerX, boxCenterY, centerX, boxCenterY - verticalForceLen, '#28a745', `FN=${(m*g).toFixed(1)}N`);

            // القوى الأفقية
            const F_app_length = F_app * forceScale;
            const F_f_length = F_f * forceScale;
            drawArrow(ctx, centerX, boxCenterY, centerX + F_app_length, boxCenterY, '#dc3545', `Fapp=${F_app.toFixed(1)}N`);
            drawArrow(ctx, centerX, boxCenterY, centerX - F_f_length, boxCenterY, '#ffc107', `Ff=${F_f.toFixed(1)}N`);

            // رسم التسارع
            if (a !== 0) {
                const acceleration_length = Math.abs(a) * 30; 
                const endX = centerX + (a > 0 ? acceleration_length : -acceleration_length);
                drawArrow(ctx, centerX, boxCenterY - 80, endX, boxCenterY - 80, '#17a2b8', `a=${a.toFixed(2)}m/s²`);
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

        // ربط الأحداث
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', calculateAndDrawPhysics); 
        });
        updateButton.addEventListener('click', calculateAndDrawPhysics);

        calculateAndDrawPhysics(); 
    }


    // ----------------------------------------------------
    // 3. منطق المقذوفات
    // ----------------------------------------------------
    else if (currentSimulation === 'projectile') {
        const canvas = document.getElementById('projectileCanvas');
        const ctx = canvas.getContext('2d');
        const g = 9.8; 

        const velInput = document.getElementById('initial-velocity');
        const angleInput = document.getElementById('launch-angle');
        const updateButton = document.getElementById('updateButton');

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

            // --- الرسم ---
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const padding = 20;
            const availableWidth = canvas.width - 2 * padding;
            const availableHeight = canvas.height - 2 * padding;
            
            const scale = Math.min(
                availableWidth / (xMax || 100), 
                availableHeight / (yMax * 2 || 100) 
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

            // رسم الأرض
            ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 1; ctx.beginPath();
            ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();
        };

        // ربط الأحداث
        [velInput, angleInput].forEach(input => {
            input.addEventListener('input', calculateAndDraw);
        });
        updateButton.addEventListener('click', calculateAndDraw);

        calculateAndDraw();
    }


    // ----------------------------------------------------
    // 4. منطق المتجهات
    // ----------------------------------------------------
    else if (currentSimulation === 'vector') {
        const canvas = document.getElementById('vectorCanvas');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const inputs = {
            magA: document.getElementById('magA'), angleA: document.getElementById('angleA'),
            magB: document.getElementById('magB'), angleB: document.getElementById('angleB')
        };
        const updateButton = document.getElementById('updateButton');

        const calculateAndDraw = () => {
            document.getElementById('magA-val').innerText = inputs.magA.value;
            document.getElementById('angleA-val').innerText = inputs.angleA.value;
            document.getElementById('magB-val').innerText = inputs.magB.value;
            document.getElementById('angleB-val').innerText = inputs.angleB.value;
            
            const magA = parseFloat(inputs.magA.value);
            const angleA = parseFloat(inputs.angleA.value);
            const magB = parseFloat(inputs.magB.value);
            const angleB = parseFloat(inputs.angleB.value);

            // الحسابات
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
            
            // رسم المحاور
            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath();
            ctx.moveTo(0, centerY); ctx.lineTo(canvas.width, centerY); 
            ctx.moveTo(centerX, 0); ctx.lineTo(centerX, canvas.height); ctx.stroke();

            // مقياس الرسم
            const maxMag = Math.max(magR, magA, magB);
            const SCALE = (canvas.width / 2) / maxMag * 0.8;
            
            const drawVectorHelper = (mag, angleDeg, color, startX, startY, label) => {
                const angleRad = angleDeg * (Math.PI / 180);
                const len = mag * SCALE;
                const endX = startX + len * Math.cos(angleRad);
                const endY = startY - len * Math.sin(angleRad); // محور Y معكوس في Canvas
                return drawArrow(ctx, startX, startY, endX, endY, color, label);
            };

            // رسم المتجهات (طريقة ذيل-رأس)
            const endA = drawVectorHelper(magA, angleA, '#007bff', centerX, centerY, 'A');
            drawVectorHelper(magB, angleB, '#28a745', endA.endX, endA.endY, 'B'); 
            
            // رسم المحصلة (طريقة متوازي الأضلاع)
            drawVectorHelper(magR, angleR, '#dc3545', centerX, centerY, 'R');
        };

        // ربط الأحداث
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', calculateAndDraw);
        });
        updateButton.addEventListener('click', calculateAndDraw);

        calculateAndDraw();
    }

});