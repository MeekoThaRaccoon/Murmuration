// Murmuration Protocol - Visual Engine
// SolarPunk's Living Infrastructure

let flock = [];
let probes = [];
let artParticles = [];
let debug = false;
let nodeCount = 5;
let probeCount = 0;
let transformCount = 0;

function setup() {
    const container = document.getElementById('p5-container');
    const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('p5-container');
    
    // Initialize flock
    for (let i = 0; i < nodeCount; i++) {
        flock.push(new Node(
            random(width),
            random(height),
            color(random(100, 200), random(200, 255), random(150, 255))
        ));
    }
    
    updateNodeDisplay();
}

function draw() {
    background(10, 15, 30, 50);
    
    // Update and display all nodes
    for (let node of flock) {
        node.applyBehaviors(flock);
        node.update();
        node.display();
    }
    
    // Update and display probes
    for (let i = probes.length - 1; i >= 0; i--) {
        probes[i].update();
        probes[i].display();
        if (probes[i].isDone()) {
            probes.splice(i, 1);
        }
    }
    
    // Update and display art particles
    for (let i = artParticles.length - 1; i >= 0; i--) {
        artParticles[i].update();
        artParticles[i].display();
        if (artParticles[i].isDone()) {
            artParticles.splice(i, 1);
        }
    }
    
    // Display connection lines
    if (!debug) {
        stroke(0, 255, 157, 30);
        strokeWeight(1);
        for (let i = 0; i < flock.length; i++) {
            for (let j = i + 1; j < flock.length; j++) {
                let d = dist(flock[i].x, flock[i].y, flock[j].x, flock[j].y);
                if (d < 150) {
                    line(flock[i].x, flock[i].y, flock[j].x, flock[j].y);
                }
            }
        }
    }
}

// Node class - represents a murmuration participant
class Node {
    constructor(x, y, col) {
        this.x = x;
        this.y = y;
        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
        this.maxSpeed = 3;
        this.maxForce = 0.1;
        this.color = col;
        this.size = 15;
        this.transforming = false;
        this.transformTimer = 0;
        this.id = Math.random().toString(36).substr(2, 9);
        this.connections = [];
    }
    
    applyBehaviors(nodes) {
        let separation = this.separate(nodes);
        let alignment = this.align(nodes);
        let cohesion = this.cohere(nodes);
        
        separation.mult(1.5);
        alignment.mult(1.0);
        cohesion.mult(1.0);
        
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);
        
        // Avoid probes
        for (let probe of probes) {
            let d = dist(this.x, this.y, probe.x, probe.y);
            if (d < 100) {
                let avoid = createVector(this.x - probe.x, this.y - probe.y);
                avoid.normalize();
                avoid.mult(0.5);
                this.applyForce(avoid);
                
                if (d < 50 && !this.transforming) {
                    this.transform();
                    transformCount++;
                    updateStatus();
                }
            }
        }
    }
    
    separate(nodes) {
        let desiredSeparation = 40;
        let steer = createVector(0, 0);
        let count = 0;
        
        for (let other of nodes) {
            let d = dist(this.x, this.y, other.x, other.y);
            if (d > 0 && d < desiredSeparation) {
                let diff = createVector(this.x - other.x, this.y - other.y);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.div(count);
            steer.setMag(this.maxSpeed);
            steer.sub(createVector(this.vx, this.vy));
            steer.limit(this.maxForce);
        }
        return steer;
    }
    
    align(nodes) {
        let neighborDist = 100;
        let sum = createVector(0, 0);
        let count = 0;
        
        for (let other of nodes) {
            let d = dist(this.x, this.y, other.x, other.y);
            if (d > 0 && d < neighborDist) {
                sum.add(createVector(other.vx, other.vy));
                count++;
            }
        }
        
        if (count > 0) {
            sum.div(count);
            sum.setMag(this.maxSpeed);
            let steer = sum.sub(createVector(this.vx, this.vy));
            steer.limit(this.maxForce);
            return steer;
        }
        return createVector(0, 0);
    }
    
    cohere(nodes) {
        let neighborDist = 100;
        let sum = createVector(0, 0);
        let count = 0;
        
        for (let other of nodes) {
            let d = dist(this.x, this.y, other.x, other.y);
            if (d > 0 && d < neighborDist) {
                sum.add(createVector(other.x, other.y));
                count++;
            }
        }
        
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);
        }
        return createVector(0, 0);
    }
    
    seek(target) {
        let desired = createVector(target.x - this.x, target.y - this.y);
        desired.setMag(this.maxSpeed);
        let steer = desired.sub(createVector(this.vx, this.vy));
        steer.limit(this.maxForce);
        return steer;
    }
    
    applyForce(force) {
        this.vx += force.x;
        this.vy += force.y;
    }
    
    update() {
        // Transform animation
        if (this.transforming) {
            this.transformTimer++;
            this.size = 15 + sin(this.transformTimer * 0.2) * 10;
            if (this.transformTimer > 60) {
                this.transforming = false;
                this.transformTimer = 0;
                this.size = 15;
                
                // Generate art from transformation
                for (let i = 0; i < 20; i++) {
                    artParticles.push(new ArtParticle(this.x, this.y, this.color));
                }
            }
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off walls
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
        
        // Limit speed
        let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
    }
    
    display() {
        push();
        translate(this.x, this.y);
        
        if (debug) {
            stroke(255, 0, 0);
            noFill();
            circle(0, 0, 100);
        }
        
        // Draw node
        fill(this.transforming ? color(255, 50, 50) : this.color);
        noStroke();
        circle(0, 0, this.size);
        
        // Draw direction indicator
        stroke(255, 200);
        strokeWeight(2);
        line(0, 0, this.vx * 10, this.vy * 10);
        
        pop();
    }
    
    transform() {
        this.transforming = true;
        this.transformTimer = 0;
        this.color = color(random(255), random(255), random(255));
    }
}

// Probe class - represents an attack
class Probe {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.life = 100;
        this.color = color(255, 50, 50);
    }
    
    update() {
        this.life -= 2;
        this.size += 0.2;
    }
    
    display() {
        fill(red(this.color), green(this.color), blue(this.color), this.life * 2.5);
        noStroke();
        circle(this.x, this.y, this.size);
        
        // Pulsing ring
        noFill();
        stroke(255, 0, 0, this.life);
        strokeWeight(2);
        circle(this.x, this.y, this.size * 2);
    }
    
    isDone() {
        return this.life <= 0;
    }
}

// Art Particle - generated from transformations
class ArtParticle {
    constructor(x, y, col) {
        this.x = x;
        this.y = y;
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.life = 255;
        this.color = col;
        this.size = random(3, 8);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 4;
        this.size *= 0.98;
    }
    
    display() {
        fill(red(this.color), green(this.color), blue(this.color), this.life);
        noStroke();
        circle(this.x, this.y, this.size);
    }
    
    isDone() {
        return this.life <= 0;
    }
}

// Global functions
function addProbe() {
    let x = random(width);
    let y = random(height);
    probes.push(new Probe(x, y));
    probeCount++;
    updateStatus();
    
    // Find nearest node
    let nearest = flock.reduce((prev, curr) => {
        let dPrev = dist(prev.x, prev.y, x, y);
        let dCurr = dist(curr.x, curr.y, x, y);
        return dCurr < dPrev ? curr : prev;
    });
    
    nearest.transform();
}

function addNode() {
    flock.push(new Node(random(width), random(height), color(random(100, 200), random(200, 255), random(150, 255))));
    nodeCount++;
    updateNodeDisplay();
    updateStatus();
}

function toggleDebug() {
    debug = !debug;
}

function updateStatus() {
    document.getElementById('status-text').textContent = 
        `🟢 Network Active - ${nodeCount} nodes murmuring`;
    document.getElementById('probe-count').textContent = 
        `Probes diverted: ${probeCount} | Transformations: ${transformCount}`;
}

function updateNodeDisplay() {
    let container = document.getElementById('node-list');
    container.innerHTML = '';
    
    flock.forEach((node, i) => {
        let card = document.createElement('div');
        card.className = 'node-card';
        card.innerHTML = `
            <h3>Node ${i + 1}</h3>
            <p>ID: ${node.id.substr(0, 8)}...</p>
            <p>Status: ${node.transforming ? '🔄 Transforming' : '🟢 Stable'}</p>
            <p>Connections: ${Math.floor(random(1, 5))}</p>
        `;
        container.appendChild(card);
    });
}

// Handle window resize
function windowResized() {
    const container = document.getElementById('p5-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
}

// Make functions global
window.addProbe = addProbe;
window.addNode = addNode;
window.toggleDebug = toggleDebug;
