// FitVision - Main App Logic with Workout Setup

class FitVisionApp {
    constructor() {
        this.currentPage = 'home';
        this.selectedExercise = null;
        this.repGoal = 10;
        this.countdownTime = 5;
        this.init();
    }

    init() {
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        }, 1500);

        // Setup navigation
        this.setupNavigation();

        // Setup event listeners
        this.setupEventListeners();

        // Load settings
        this.loadSettings();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    navigateTo(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
        }
    }

    setupEventListeners() {
        // Start workout button
        document.getElementById('start-workout-btn').addEventListener('click', () => {
            this.startWorkout();
        });

        // Exercise cards
        document.querySelectorAll('.exercise-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', () => {
                const exercise = card.dataset.exercise;
                this.selectExercise(exercise);
            });
        });

        // Stop workout button
        document.getElementById('stop-workout-btn').addEventListener('click', () => {
            this.stopWorkout();
        });

        // Settings
        document.getElementById('show-skeleton').addEventListener('change', (e) => {
            this.updateSetting('showSkeleton', e.target.checked);
        });

        document.getElementById('show-feedback').addEventListener('change', (e) => {
            this.updateSetting('showFeedback', e.target.checked);
        });

        document.getElementById('fps-limit').addEventListener('change', (e) => {
            this.updateSetting('fpsLimit', parseInt(e.target.value));
        });

        // Setup modal buttons
        document.getElementById('cancel-setup-btn').addEventListener('click', () => {
            this.hideSetupModal();
        });

        document.getElementById('confirm-setup-btn').addEventListener('click', () => {
            const repGoal = parseInt(document.getElementById('rep-goal').value);
            const countdownTime = parseInt(document.getElementById('countdown-time').value);
            this.startWorkoutWithSettings(repGoal, countdownTime);
        });
    }

    selectExercise(exercise) {
        this.selectedExercise = exercise;

        // Visual feedback
        document.querySelectorAll('.exercise-card').forEach(card => {
            card.style.borderColor = '';
        });

        event.currentTarget.style.borderColor = 'var(--primary-color)';
    }

    async startWorkout() {
        if (!this.selectedExercise) {
            this.selectedExercise = 'deadlift'; // Default
        }

        // Show setup modal
        this.showSetupModal();
    }

    showSetupModal() {
        const modal = document.getElementById('workout-setup-modal');
        modal.classList.remove('hidden');
    }

    hideSetupModal() {
        const modal = document.getElementById('workout-setup-modal');
        modal.classList.add('hidden');
    }

    async startWorkoutWithSettings(repGoal, countdownTime) {
        // Store settings
        this.repGoal = repGoal;
        this.countdownTime = countdownTime;

        // Hide modal
        this.hideSetupModal();

        // Navigate to camera page
        this.navigateTo('camera');

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === 'camera') {
                item.classList.add('active');
            }
        });

        // Initialize camera first
        try {
            await window.cameraManager.start();
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.showError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งาน');
            this.navigateTo('home');
            return;
        }

        // Show countdown
        await this.showCountdown(countdownTime);

        // Start pose detection after countdown
        try {
            await window.poseDetector.start();

            // Update rep goal display
            document.getElementById('rep-goal-display').textContent = repGoal;

            // Reset rep counter
            if (window.formAnalyzer) {
                window.formAnalyzer.reset();
                window.formAnalyzer.repGoal = repGoal;
            }
        } catch (error) {
            console.error('Failed to start pose detection:', error);
            this.showError('ไม่สามารถเริ่มตรวจจับท่าได้');
        }
    }

    async showCountdown(seconds) {
        const overlay = document.getElementById('countdown-overlay');
        const numberEl = document.getElementById('countdown-number');

        overlay.classList.remove('hidden');

        for (let i = seconds; i > 0; i--) {
            numberEl.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        overlay.classList.add('hidden');
    }

    stopWorkout() {
        // Stop camera and pose detection
        if (window.cameraManager) {
            window.cameraManager.stop();
        }

        if (window.poseDetector) {
            window.poseDetector.stop();
        }

        // Navigate back to home
        this.navigateTo('home');

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === 'home') {
                item.classList.add('active');
            }
        });
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('fitvision-settings') || '{}');

        // Apply settings
        if (settings.showSkeleton !== undefined) {
            document.getElementById('show-skeleton').checked = settings.showSkeleton;
        }

        if (settings.showFeedback !== undefined) {
            document.getElementById('show-feedback').checked = settings.showFeedback;
        }

        if (settings.fpsLimit) {
            document.getElementById('fps-limit').value = settings.fpsLimit;
        }
    }

    updateSetting(key, value) {
        const settings = JSON.parse(localStorage.getItem('fitvision-settings') || '{}');
        settings[key] = value;
        localStorage.setItem('fitvision-settings', JSON.stringify(settings));

        // Apply setting
        if (key === 'fpsLimit' && window.poseDetector) {
            window.poseDetector.setFPS(value);
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitVisionApp();
});
