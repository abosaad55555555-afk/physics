// js/app.js - ملف الجافاسكريبت النهائي والموحد لجميع المحاكيات

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. تحديد المحاكي النشط
    let currentSimulation = null;
    if (document.getElementById('newtonCanvas')) {
        currentSimulation = 'newton';
    } else if (document.getElementById('projectileCanvas')) {
        currentSimulation = 'projectile';
    } else if (document.getElementById('vectorCanvas')) {
        currentSimulation = 'vector';
    } else if (document.getElementById('energyCanvas')) {
        currentSimulation = 'energy';
    } else if (document.getElementById('pendulumCanvas')) { // إضافة محاكي البندول
        currentSimulation = 'pendulum';
    }

    if (!currentSimulation) return; // الخروج إذا لم يكن هناك محاكي نشط
    
    // ----------------------------------------------------
    // دالة مساعدة لرسم الأسهم (مُستخدمة في نيوتن والمتجهات)
    // ----------------------------------------------------
    function drawArrow(ctx, startX, startY, endX, endY, color, text) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 10;
        
        // رسم رأس السهم باستخدام التحويلات
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLength, headLength / 2);
        ctx.lineTo(-headLength, -headLength / 2);
        ctx.fill();
        ctx.restore();

        // كتابة النص
        ctx.fillStyle = '#343a40'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
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
            
            // تحديد مقياس رسم ديناميكي
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

            // رسم المسار
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

        // بدء الرسم بالحالة الأولية عند التحميل
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
                const endY = startY - len * Math.sin(angleRad); 
                return drawArrow(ctx, startX, startY, endX, endY, color, label);
            };

            // رسم المتجهات (طريقة ذيل-رأس) والمحصلة
            const endA = drawVectorHelper(magA, angleA, '#007bff', centerX, centerY, 'A');
            drawVectorHelper(magB, angleB, '#28a745', endA.endX, endA.endY, 'B'); 
            drawVectorHelper(magR, angleR, '#dc3545', centerX, centerY, 'R');
        };

        // ربط الأحداث
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', calculateAndDraw);
        });
        updateButton.addEventListener('click', calculateAndDraw);

        calculateAndDraw();
    }


    // ----------------------------------------------------
    // 5. منطق حفظ الطاقة
    // ----------------------------------------------------
    else if (currentSimulation === 'energy') {
        const canvas = document.getElementById('energyCanvas');
        const ctx = canvas.getContext('2d');
        const g = 9.8; 
        const FRAME_RATE = 60; 
        
        let animationFrameId = null;
        let t = 0; 
        let isRunning = false;
        
        const inputs = {
            mass: document.getElementById('mass-input-e'),
            height: document.getElementById('height-input-e')
        };
        const updateButton = document.getElementById('updateButton');

        const outputs = {
            massVal: document.getElementById('mass-value-e'),
            heightVal: document.getElementById('height-input-e'),
            pe: document.getElementById('pe-value'),
            ke: document.getElementById('ke-value'),
            eTotal: document.getElementById('etotal-value'),
            status: document.getElementById('status-display')
        };

        const drawSystem = (m, hMax, currentH, currentV) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const padding = 50;
            const availableHeight = canvas.height - 2 * padding;
            const floorY = canvas.height - padding;

            const scale = availableHeight / hMax; 
            const ballRadius = 15;
            const ballX = canvas.width / 2;
            const ballY = floorY - (currentH * scale);

            // رسم الأرض
            ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(canvas.width, floorY); ctx.stroke();
            
            // رسم خط الارتفاع الأقصى
            ctx.strokeStyle = '#28a745'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(padding / 2, floorY - (hMax * scale)); 
            ctx.lineTo(canvas.width - padding / 2, floorY - (hMax * scale)); ctx.stroke();
            ctx.setLineDash([]); 

            // رسم الكرة
            ctx.fillStyle = '#dc3545';
            ctx.beginPath();
            ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
            ctx.fill();

            // عرض البيانات على الرسم
            ctx.fillStyle = '#343a40'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'right';
            ctx.fillText(`h: ${currentH.toFixed(2)} m`, ballX - ballRadius - 5, ballY);
            ctx.fillText(`v: ${currentV.toFixed(2)} m/s`, ballX - ballRadius - 5, ballY + 20);
        };

        const updateEnergyValues = (m, hMax, currentH, currentV) => {
            const PE = m * g * currentH;
            const KE = 0.5 * m * Math.pow(currentV, 2);
            // يتم حساب الطاقة الكلية عند hMax لضمان الثبات
            const E_total = m * g * hMax; 
            
            outputs.pe.innerText = PE.toFixed(2);
            outputs.ke.innerText = KE.toFixed(2);
            outputs.eTotal.innerText = E_total.toFixed(2);
        };
        
        const runSimulation = () => {
            if (!isRunning) return;

            const m = parseFloat(inputs.mass.value);
            const hMax = parseFloat(inputs.height.value);
            
            const tFlight = Math.sqrt((2 * hMax) / g);
            const timePeriod = 2 * tFlight; 

            t += 1 / FRAME_RATE;
            let cycleT = t % timePeriod; 
            
            if (cycleT > tFlight) {
                cycleT = timePeriod - cycleT; 
            }

            // معادلات الحركة (سقوط حر ثم ارتداد مثالي)
            const currentH = hMax - 0.5 * g * Math.pow(cycleT, 2);
            const currentV = g * cycleT;

            drawSystem(m, hMax, currentH, currentV);
            updateEnergyValues(m, hMax, currentH, currentV);
            
            animationFrameId = requestAnimationFrame(runSimulation);
        };
        
        const startSimulation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            isRunning = true;
            t = 0; 
            outputs.status.innerText = 'الحالة: قيد التشغيل 🟢';
            updateButton.innerText = 'إعادة تعيين (Reset)';
            
            outputs.massVal.innerText = inputs.mass.value;
            outputs.heightVal.innerText = inputs.height.value;
            
            runSimulation();
        };

        const pauseSimulation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            isRunning = false;
            outputs.status.innerText = 'الحالة: جاهز للإطلاق ⏸️';
            updateButton.innerText = 'بدء المحاكاة';
            
            // عرض الحالة الأولية
            const m = parseFloat(inputs.mass.value);
            const hMax = parseFloat(inputs.height.value);
            outputs.massVal.innerText = m;
            outputs.heightVal.innerText = hMax;

            updateEnergyValues(m, hMax, hMax, 0);
            drawSystem(m, hMax, hMax, 0);
        };

        // ربط الأحداث
        updateButton.addEventListener('click', () => {
            if (isRunning) {
                pauseSimulation();
            } else {
                startSimulation();
            }
        });
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', pauseSimulation); 
        });

        pauseSimulation(); 
    }
    
    // ----------------------------------------------------
    // 6. منطق محاكي البندول (Simple Pendulum) - تم الإصلاح
    // ----------------------------------------------------
    else if (currentSimulation === 'pendulum') {
        const canvas = document.getElementById('pendulumCanvas');
        const ctx = canvas.getContext('2d');
        const g = 9.8; 
        const FRAME_RATE = 60; 
        
        let animationFrameId = null;
        let t = 0; 
        let isRunning = false;
        
        // نقطة التعليق (المرجع)
        const pivotX = canvas.width / 2;
        const pivotY = 50; 
        
        const inputs = {
            length: document.getElementById('length-input'),
            angle: document.getElementById('angle-input'),
            mass: document.getElementById('mass-input')
        };
        const updateButton = document.getElementById('updateButton');
        const outputs = {
            periodCalc: document.getElementById('period-calculated'),
            frequency: document.getElementById('frequency')
        };
        
        let initialAngleRad;
        let pendulumLength;
        let angularFrequency;

        const updatePhysics = () => {
            // تحديث قيم المدخلات في الواجهة
            document.getElementById('length-value').innerText = inputs.length.value;
            document.getElementById('angle-value').innerText = inputs.angle.value;
            document.getElementById('mass-value').innerText = inputs.mass.value;

            pendulumLength = parseFloat(inputs.length.value);
            const initialAngleDeg = parseFloat(inputs.angle.value);
            initialAngleRad = initialAngleDeg * (Math.PI / 180);
            
            // حساب الخصائص الفيزيائية
            // W (أوميجا) = sqrt(g/L)
            angularFrequency = Math.sqrt(g / pendulumLength);
            // T = 2 * PI / W
            const period = (2 * Math.PI) / angularFrequency;
            const freq = 1 / period;

            outputs.periodCalc.innerText = period.toFixed(3);
            outputs.frequency.innerText = freq.toFixed(3);
        };
        
        const drawPendulum = (currentAngleRad) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scaleFactor = 100; // مقياس رسم مرئي (1 متر = 100 بكسل)
            const visualLength = pendulumLength * scaleFactor;

            // حساب موضع الكتلة (x, y) باستخدام الإحداثيات القطبية
            // (الزاوية تقاس من المحور العمودي الموجب)
            const ballX = pivotX + visualLength * Math.sin(currentAngleRad);
            const ballY = pivotY + visualLength * Math.cos(currentAngleRad);
            const ballRadius = 15 + (parseFloat(inputs.mass.value) / 5) * 10; // حجم يعتمد على الكتلة

            // 1. رسم دعم نقطة التعليق
            ctx.fillStyle = '#495057';
            ctx.fillRect(pivotX - 30, pivotY - 5, 60, 10);
            
            // 2. رسم الخيط
            ctx.strokeStyle = '#6c757d'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(ballX, ballY);
            ctx.stroke();
            
            // 3. رسم خط عمودي مرجعي (للتأكد من موقع الاتزان)
            ctx.strokeStyle = '#ccc'; ctx.setLineDash([2, 5]);
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(pivotX, pivotY + visualLength);
            ctx.stroke();
            ctx.setLineDash([]); 

            // 4. رسم كتلة البندول
            ctx.fillStyle = '#007bff';
            ctx.beginPath();
            ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
            ctx.fill();
        };

        const runSimulation = () => {
            if (!isRunning) return;

            t += 1 / FRAME_RATE;
            
            // معادلة الحركة التوافقية البسيطة: Theta(t) = Theta_max * cos(W * t)
            const currentAngleRad = initialAngleRad * Math.cos(angularFrequency * t);

            drawPendulum(currentAngleRad);
            
            animationFrameId = requestAnimationFrame(runSimulation);
        };
        
        const startSimulation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            isRunning = true;
            t = 0; // إعادة ضبط الزمن عند البدء
            updateButton.innerText = 'إيقاف مؤقت (Pause)';
            
            updatePhysics(); 
            runSimulation();
        };

        const pauseSimulation = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            isRunning = false;
            updateButton.innerText = 'بدء المحاكاة (Start)';
            
            updatePhysics(); 
            // رسم البندول في نقطة البدء (initialAngleRad)
            drawPendulum(initialAngleRad);
        };

        // ربط الأحداث
        updateButton.addEventListener('click', () => {
            if (isRunning) {
                pauseSimulation();
            } else {
                startSimulation();
            }
        });
        
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', pauseSimulation); 
        });

        // التهيئة الأولية: يجب استدعاء updatePhysics قبل pauseSimulation لأجل initialAngleRad
        updatePhysics();
        pauseSimulation(); 
    }
});