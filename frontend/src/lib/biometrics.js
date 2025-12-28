export class BiometricCollector {
    constructor() {
        this.events = [];
        this.active = false;
    }

    start() {
        this.active = true;
        this.events = [];
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    stop() {
        this.active = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        return this.events;
    }

    reset() {
        this.events = [];
    }

    getEvents() {
        return [...this.events];
    }

    handleKeyDown = (e) => {
        if (!this.active) return;
        // Ignore Repeat events if you want strictly physical presses, 
        // but repeat keydown is common. Let's keep it but mark it?
        // For simplicity, mostly ignore repeat for Dwell calculations 
        // OR just log everything and let backend filtered.
        if (e.repeat) return;

        this.events.push({
            key: e.key,
            type: 'keydown',
            timestamp: performance.now()
        });
    }

    handleKeyUp = (e) => {
        if (!this.active) return;
        this.events.push({
            key: e.key,
            type: 'keyup',
            timestamp: performance.now()
        });
    }
}
