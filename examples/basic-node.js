// Basic Murmuration Node Implementation
// Run this on any device to join a murmuration

const WebSocket = require('ws');

class MurmurationNode {
    constructor(id, options = {}) {
        this.id = id;
        this.connections = new Set();
        this.state = 'stable';
        this.position = { x: 0, y: 0 };
        this.artGenerators = options.artGenerators || ['particle', 'wave'];
        this.transformationCount = 0;
        
        // Network settings
        this.websocket = null;
        this.reconnectInterval = 5000;
        this.peers = new Map();
    }

    connect(serverUrl) {
        this.websocket = new WebSocket(serverUrl);
        
        this.websocket.onopen = () => {
            console.log(`Node ${this.id} connected to murmuration`);
            this.send({ type: 'join', nodeId: this.id });
        };

        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.websocket.onclose = () => {
            console.log(`Connection lost, reconnecting in ${this.reconnectInterval}ms`);
            setTimeout(() => this.connect(serverUrl), this.reconnectInterval);
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                console.log(`Joined murmuration with ${message.nodeCount} nodes`);
                break;
                
            case 'probe':
                this.handleProbe(message);
                break;
                
            case 'transformation':
                this.learnFromTransformation(message);
                break;
                
            case 'position_update':
                this.updatePeers(message);
                break;
        }
    }

    handleProbe(probe) {
        console.log(`Probe detected from ${probe.source}`);
        
        // Transform
        this.state = 'transforming';
        this.transformationCount++;
        
        // Generate art
        const artType = this.artGenerators[
            Math.floor(Math.random() * this.artGenerators.length)
        ];
        
        const transformation = {
            type: 'transformation',
            nodeId: this.id,
            probeId: probe.id,
            artType,
            timestamp: Date.now(),
            newState: this.generateNewState()
        };

        // Share transformation with network
        this.send(transformation);
        
        // Return to stable after delay
        setTimeout(() => {
            this.state = 'stable';
            console.log(`Node ${this.id} stabilized`);
        }, 2000);
    }

    generateNewState() {
        const states = ['nebulous', 'crystalline', 'fluid', 'modulated'];
        return states[Math.floor(Math.random() * states.length)];
    }

    learnFromTransformation(transformation) {
        console.log(`Learning from ${transformation.nodeId}'s transformation`);
        // In a real implementation, this would update behavior
    }

    updatePeers(update) {
        if (!this.peers.has(update.nodeId)) {
            this.peers.set(update.nodeId, {});
        }
        this.peers.get(update.nodeId).position = update.position;
    }

    send(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    // Murmuration behaviors
    updatePosition() {
        // Basic flocking simulation
        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let separation = { x: 0, y: 0 };
        
        let neighborCount = 0;
        
        this.peers.forEach((peer, id) => {
            if (id === this.id) return;
            
            const dx = peer.position.x - this.position.x;
            const dy = peer.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                // Alignment: match average velocity
                // Cohesion: move toward average position
                // Separation: avoid crowding
                
                neighborCount++;
            }
        });
        
        // Update position
        this.position.x += (alignment.x + cohesion.x + separation.x) * 0.1;
        this.position.y += (alignment.y + cohesion.y + separation.y) * 0.1;
        
        // Send update
        this.send({
            type: 'position_update',
            nodeId: this.id,
            position: this.position
        });
    }
}

// Example usage
if (require.main === module) {
    const nodeId = process.argv[2] || `node_${Math.random().toString(36).substr(2, 9)}`;
    const serverUrl = process.argv[3] || 'ws://localhost:8080';
    
    const node = new MurmurationNode(nodeId);
    node.connect(serverUrl);
    
    // Update position every second
    setInterval(() => node.updatePosition(), 1000);
    
    console.log(`Murmuration node ${nodeId} running`);
    console.log(`Connect to ${serverUrl}`);
    console.log('Press Ctrl+C to exit');
}

module.exports = MurmurationNode;
