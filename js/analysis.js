// Form Analysis with Improved Thresholds and Rep Counting

class FormAnalyzer {
    constructor() {
        this.apiUrl = 'http://localhost:8000';
        this.repCount = 0;
        this.lastPrediction = null;
        this.feedbackTimeout = null;
        this.repGoal = null;

        // For better rep counting
        this.inDownPosition = false;
        this.hipAngleHistory = [];
        this.historySize = 5;
    }

    async analyze(features) {
        try {
            const prediction = this.analyzeClientSide(features);
            this.updateUI(prediction);
            this.updateRepCountImproved(features, prediction);
        } catch (error) {
            console.error('Analysis error:', error);
        }
    }

    analyzeClientSide(features) {
        // Improved analysis with more lenient thresholds

        const leftHipAngle = features[4];
        const rightHipAngle = features[5];
        const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

        const leftKneeAngle = features[6];
        const rightKneeAngle = features[7];
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        let formCorrect = true;
        let feedback = 'ท่าดี!';

        // More lenient thresholds
        if (avgHipAngle < 80) {
            formCorrect = false;
            feedback = 'ยกสะโพกขึ้นหน่อย';
        } else if (avgHipAngle > 175) {
            formCorrect = false;
            feedback = 'อย่าเอนหลังมาก';
        }

        if (avgKneeAngle < 135) {
            formCorrect = false;
            feedback = 'เหยียดเข่าให้ตรง';
        }

        return {
            formCorrect,
            feedback,
            confidence: 0.85,
            hipAngle: avgHipAngle
        };
    }

    updateRepCountImproved(features, prediction) {
        // Better rep counting using hip angle
        const avgHipAngle = prediction.hipAngle;

        // Add to history
        this.hipAngleHistory.push(avgHipAngle);
        if (this.hipAngleHistory.length > this.historySize) {
            this.hipAngleHistory.shift();
        }

        // Need at least 3 readings
        if (this.hipAngleHistory.length < 3) {
            return;
        }

        // Calculate average
        const avgAngle = this.hipAngleHistory.reduce((a, b) => a + b, 0) / this.hipAngleHistory.length;

        // Detect down position (bent over)
        if (avgAngle < 110 && !this.inDownPosition) {
            this.inDownPosition = true;
        }

        // Detect up position (standing) - count rep
        if (avgAngle > 160 && this.inDownPosition) {
            this.inDownPosition = false;
            this.repCount++;

            const repCountEl = document.getElementById('rep-count');
            if (repCountEl) {
                repCountEl.textContent = this.repCount;
            }

            // Check if goal reached
            if (this.repGoal && this.repCount >= this.repGoal) {
                this.showSuccess();
            }
        }
    }

    async callAPI(features) {
        const response = await fetch(`${this.apiUrl}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ features })
        });

        return await response.json();
    }

    updateUI(prediction) {
        const formStatus = document.getElementById('form-status');
        if (formStatus) {
            formStatus.textContent = prediction.formCorrect ? '✓' : '✗';
            formStatus.style.color = prediction.formCorrect ? '#10b981' : '#ef4444';
        }

        const showFeedback = document.getElementById('show-feedback').checked;

        if (showFeedback && !prediction.formCorrect) {
            this.showFeedback(prediction.feedback, prediction.formCorrect);
        }
    }

    showFeedback(message, isCorrect) {
        const overlay = document.getElementById('feedback-overlay');
        const icon = document.getElementById('feedback-icon');
        const text = document.getElementById('feedback-text');

        if (overlay && icon && text) {
            icon.textContent = isCorrect ? '✅' : '⚠️';
            text.textContent = message;

            overlay.classList.remove('hidden');

            clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
            }, 2000);
        }
    }

    showSuccess() {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <h2>🎉 สำเร็จ!</h2>
            <p>ทำครบ ${this.repGoal} ครั้งแล้ว</p>
            <p style="font-size: 1.2rem; margin-top: 20px;">เยี่ยมมาก! 💪</p>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
            if (window.app) {
                window.app.stopWorkout();
            }
        }, 3000);
    }

    reset() {
        this.repCount = 0;
        this.lastPrediction = null;
        this.inDownPosition = false;
        this.hipAngleHistory = [];

        const repCountEl = document.getElementById('rep-count');
        if (repCountEl) {
            repCountEl.textContent = '0';
        }
    }
}

// Initialize
window.formAnalyzer = new FormAnalyzer();
