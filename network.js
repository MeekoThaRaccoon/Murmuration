// Murmuration Protocol - Network Layer Simulation

class NetworkSimulator {
    constructor() {
        this.nodes = [];
        this.messages = [];
        this.messageHistory = [];
        this.transformationLog = [];
        this.startTime = Date.now();
    }

    addNode(id, type = 'standard') {
        const node = {
            id,
            type,
            connections: [],
            state: 'stable',
            lastTransform: null,
            transformationCount: 0,
            location: this.generateLocation(),
            capabilities: this.generateCapabilities(type)
        };
        this.nodes.push(node);
        
        // Connect to existing nodes
        this.establishConnections(node);
        
        this.log(`Node ${id} joined the murmuration`);
        return node;
    }

    generateLocation() {
        return {
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            region: ['forest', 'urban', 'rural', 'coastal'][Math.floor(Math.random() * 4)]
        };
    }

    generateCapabilities(type) {
        const base = {
            storage: Math.random() * 100,
            bandwidth: 10 + Math.random() * 90,
            compute: 1 + Math.random() * 9,
            artGenerators: ['particle', 'wave', 'fractal', 'glyph']
        };

        if (type === 'gateway') {
            base.storage *= 2;
            base.bandwidth *= 1.5;
            base.artGenerators.push('holographic');
        }

        return base;
    }

    establishConnections(newNode) {
        // Connect to 2-4 existing nodes
        const targetConnections = 2 + Math.floor(Math.random() * 3);
        const potentialConnections = this.nodes.filter(n => n.id !== newNode.id);
        
        potentialConnections.sort(() => Math.random() - 0.5)
            .slice(0, targetConnections)
            .forEach(node => {
                newNode.connections.push(node.id);
                node.connections.push(newNode.id);
            });
    }

    sendMessage(senderId, receiverId, content, isProbe = false) {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: senderId,
            receiver: receiverId,
            content,
            timestamp: Date.now(),
            isProbe,
            hops: 0,
            route: [senderId]
        };

        this.messages.push(message);
        this.log(`Message ${message.id} sent from ${senderId} to ${receiverId}`);
        
        if (isProbe) {
            this.handleProbe(message);
        }

        return message;
    }

    handleProbe(message) {
        const receiver = this.nodes.find(n => n.id === message.receiver);
        if (!receiver) return;

        // Transform the node
        receiver.state = 'transforming';
        receiver.lastTransform = Date.now();
        receiver.transformationCount++;
        
        // Generate art response
        const artType = receiver.capabilities.artGenerators[
            Math.floor(Math.random() * receiver.capabilities.artGenerators.length)
        ];
        
        const transformation = {
            nodeId: receiver.id,
            probeId: message.id,
            timestamp: Date.now(),
            artType,
            newState: this.generateNewState(receiver),
            signature: this.generateSignature()
        };

        this.transformationLog.push(transformation);
        this.log(`Node ${receiver.id} transformed in response to probe ${message.id}, generated ${artType} art`);

        // Spread transformation to neighbors
        setTimeout(() => {
            receiver.state = 'stable';
            this.log(`Node ${receiver.id} stabilized after transformation`);
        }, 2000);
    }

    generateNewState(node) {
        const states = [
            'nebulous',
            'crystalline',
            'fluid',
            'modulated',
            'resonant',
            'holographic'
        ];
        return states[Math.floor(Math.random() * states.length)];
    }

    generateSignature() {
        return '0x' + Array.from({length: 16}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getNetworkHealth() {
        const totalNodes = this.nodes.length;
        const transformingNodes = this.nodes.filter(n => n.state === 'transforming').length;
        const avgConnections = this.nodes.reduce((sum, n) => sum + n.connections.length, 0) / totalNodes;
        
        return {
            totalNodes,
            transformingNodes,
            stableNodes: totalNodes - transformingNodes,
            avgConnections: avgConnections.toFixed(2),
            uptime: Date.now() - this.startTime,
            totalTransformations: this.transformationLog.length
        };
    }

    getTransformationArt(limit = 5) {
        return this.transformationLog
            .slice(-limit)
            .map(t => ({
                node: t.nodeId,
                art: t.artType,
                state: t.newState,
                time: new Date(t.timestamp).toLocaleTimeString()
            }));
    }

    log(message) {
        const entry = {
            timestamp: new Date().toISOString(),
            message
        };
        this.messageHistory.push(entry);
        
        // Keep only last 100 messages
        if (this.messageHistory.length > 100) {
            this.messageHistory.shift();
        }
        
        console.log(`[Murmuration] ${message}`);
    }
}

// Initialize and export
const murmurationNetwork = new NetworkSimulator();

// Add some initial nodes
['raven', 'sparrow', 'falcon', 'owl', 'hummingbird'].forEach((name, i) => {
    murmurationNetwork.addNode(name, i === 0 ? 'gateway' : 'standard');
});

// Demo: Send a probe after 3 seconds
setTimeout(() => {
    murmurationNetwork.sendMessage(
        'external_probe',
        'sparrow',
        'scanning_for_vulnerabilities',
        true
    );
}, 3000);

// Export for browser
window.murmurationNetwork = murmurationNetwork;
