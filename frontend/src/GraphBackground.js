/*
 * Animated floating graph nodes (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */
import React, { useEffect, useRef } from "react";

function GraphBackground() {
    const svgRef = useRef(null);

    useEffect(() => {
    function main() {
        // Initialize the graph, form inputs, SVG output
        let graph = new SvgGraph();
        initInputHandlers(graph);
        let svg = document.querySelector("article svg");
        graph.setOutput(svg).initSvgGraph();
        // Periodically update graph to create animation
        const frameIntervalMs = 50;
        setInterval(() => {
            graph.stepFrame();
            graph.redrawOutput();
        }, frameIntervalMs);
    }
    // Sets event handlers for form input elements, and sets configuration variables.
    function initInputHandlers(graph) {
        graph.idealNumNodes = 15;
        graph.extraEdgeProportion = 0.2;
        graph.radiiWeightPower = 1;
        graph.driftSpeed = 0.001;
        graph.repulsionForce = 0.0000005;
    }
    /*---- Major graph classes ----*/
    class Graph {
        constructor() {
            // Configuration
            this.idealNumNodes = NaN;
            this.extraEdgeProportion = NaN;
            this.radiiWeightPower = NaN;
            this.driftSpeed = NaN;
            this.repulsionForce = NaN;
            this.borderFade = -0.02;
            this.fadeInPerFrame = 0.06; // In the range (0.0, 1.0]
            this.fadeOutPerFrame = -0.03; // In the range [-1.0, 0.0)
            // State
            this.relWidth = NaN;
            this.relHeight = NaN;
            this.frameNumber = NaN;
            this.nodes = [];
            this.edges = [];
        }
        setDimensions(rw, rh) {
            if (rw < 0 || rw > 1 || rh < 0 || rh > 1 || (rw !== 1 && rh !== 1))
                throw new Error("Assertion error");
            this.relWidth = rw;
            this.relHeight = rh;
            return this;
        }
        initGraph() {
            this.nodes = [];
            this.edges = [];
            this.frameNumber = 0;
        }
        stepFrame() {
            this.updateNodes();
            this.updateEdges();
            this.frameNumber++;
        }
        // Updates, adds, and remove nodes according to the animation rules.
        updateNodes() {
            // Update each node's position, velocity, opacity. Remove fully transparent nodes.
            let newNodes = [];
            let curIdealNumNodes = Math.min(Math.floor(this.frameNumber / 10), this.idealNumNodes);
            for (let node of this.nodes) {
                // Move based on velocity
                node.posX += node.velX * this.driftSpeed;
                node.posY += node.velY * this.driftSpeed;
                // Randomly perturb velocity, with damping
                node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
                node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
                // Fade out nodes near the borders of the rectangle, or exceeding the target number of nodes
                const insideness = Math.min(node.posX, this.relWidth - node.posX, node.posY, this.relHeight - node.posY);
                node.fade(newNodes.length < curIdealNumNodes && insideness > this.borderFade ?
                    this.fadeInPerFrame : this.fadeOutPerFrame);
                // Only keep visible nodes
                if (node.opacity > 0)
                    newNodes.push(node);
            }
            // Add new nodes to fade in
            while (newNodes.length < curIdealNumNodes) {
                newNodes.push(new GNode(Math.random() * this.relWidth, Math.random() * this.relHeight, // Position X and Y
                (Math.pow(Math.random(), 5) + 0.35) * 0.01, // Radius skewing toward smaller values
                0.0, 0.0)); // Velocity
            }
            // Spread out nodes a bit
            this.nodes = newNodes;
            this.doForceField();
        }
        // Updates the position of each node in place, based on their existing
        // positions. Doesn't change velocity, opacity, edges, or anything else.
        doForceField() {
            // For aesthetics, we perturb positions instead of velocities
            for (let i = 0; i < this.nodes.length; i++) {
                let a = this.nodes[i];
                a.dPosX = 0;
                a.dPosY = 0;
                for (let j = 0; j < i; j++) {
                    let b = this.nodes[j];
                    let dx = a.posX - b.posX;
                    let dy = a.posY - b.posY;
                    const distSqr = dx * dx + dy * dy;
                    // Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
                    // 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
                    const factor = this.repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
                    dx *= factor;
                    dy *= factor;
                    a.dPosX += dx;
                    a.dPosY += dy;
                    b.dPosX -= dx;
                    b.dPosY -= dy;
                }
            }
            for (let node of this.nodes) {
                node.posX += node.dPosX;
                node.posY += node.dPosY;
            }
        }
        // Updates, adds, and remove edges according to the animation rules.
        updateEdges() {
            // Calculate array of spanning tree edges, then add some extra low-weight edges
            let allEdges = this.calcAllEdgeWeights();
            const idealNumEdges = Math.round((this.nodes.length - 1) * (1 + this.extraEdgeProportion));
            let idealEdges = this.calcSpanningTree(allEdges);
            for (const [_, i, j] of allEdges) {
                if (idealEdges.length >= idealNumEdges)
                    break;
                let edge = new GEdge(this.nodes[i], this.nodes[j]); // Convert data formats
                if (!Graph.containsEdge(idealEdges, edge))
                    idealEdges.push(edge);
            }
            // Classify each current edge, checking whether it is in the ideal set; prune faded edges
            let newEdges = [];
            for (let edge of this.edges) {
                edge.fade(Graph.containsEdge(idealEdges, edge) ?
                    this.fadeInPerFrame : this.fadeOutPerFrame);
                if (Math.min(edge.opacity, edge.nodeA.opacity, edge.nodeB.opacity) > 0)
                    newEdges.push(edge);
            }
            // If there's room for new edges, add some missing spanning tree edges (higher priority), then extra edges
            for (const edge of idealEdges) {
                if (newEdges.length >= idealNumEdges)
                    break;
                if (!Graph.containsEdge(newEdges, edge))
                    newEdges.push(edge);
            }
            this.edges = newEdges;
        }
        // Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
        calcAllEdgeWeights() {
            // Each entry has the form [weight,nodeAIndex,nodeBIndex], where nodeAIndex < nodeBIndex
            let result = [];
            for (let i = 0; i < this.nodes.length; i++) { // Calculate all n * (n - 1) / 2 edges
                const a = this.nodes[i];
                for (let j = 0; j < i; j++) {
                    const b = this.nodes[j];
                    let weight = Math.hypot(a.posX - b.posX, a.posY - b.posY); // Euclidean distance
                    weight /= Math.pow(a.radius * b.radius, this.radiiWeightPower); // Give discount based on node radii
                    result.push([weight, i, j]);
                }
            }
            return result.sort((a, b) => a[0] - b[0]); // Sort by ascending weight
        }
        // Returns a new array of edge objects that is a minimal spanning tree on the given set
        // of nodes, with edges in ascending order of weight. Pure function, no side effects.
        calcSpanningTree(allEdges) {
            // Kruskal's MST algorithm
            let result = [];
            let ds = new DisjointSet(this.nodes.length);
            for (const [_, i, j] of allEdges) {
                if (ds.mergeSets(i, j)) {
                    result.push(new GEdge(this.nodes[i], this.nodes[j])); // Convert data formats
                    if (result.length >= this.nodes.length - 1)
                        break;
                }
            }
            return result;
        }
        // Tests whether the given array of edge objects contains an edge with
        // the given endpoints (undirected). Pure function, no side effects.
        static containsEdge(edges, edge) {
            for (const e of edges) {
                if ((e.nodeA === edge.nodeA && e.nodeB === edge.nodeB) ||
                    (e.nodeA === edge.nodeB && e.nodeB === edge.nodeA))
                    return true;
            }
            return false;
        }
    }
    class SvgGraph extends Graph {
        constructor() {
            super(...arguments);
            this.svgElem = null;
        }
        setOutput(svg) {
            let br = svg.getBoundingClientRect();
            this.setDimensions(br.width / Math.max(br.width, br.height), br.height / Math.max(br.width, br.height));
            this.svgElem = svg;
            svg.setAttribute("viewBox", `0 0 ${this.relWidth} ${this.relHeight}`);
            let rectElem = svg.querySelector("rect");
            svg.setAttribute("width", this.relWidth.toString());
            svg.setAttribute("height", this.relHeight.toString());
            svg.querySelectorAll("stop")[0].setAttribute("stop-color", "#4c874f");
            svg.querySelectorAll("stop")[1].setAttribute("stop-color", "#4c874f");
            return this;
        }
        initSvgGraph() {
            this.initGraph();
            this.redrawOutput();
        }
        redrawOutput() {
            if (this.svgElem === null)
                throw new Error("Invalid state");
            let svg = this.svgElem;
            // Clear movable objects
            let gElem = svg.querySelector("g");
            while (gElem.firstChild !== null) gElem.removeChild(gElem.firstChild);

            function createSvgElem(tag, attribs) {
                let result = document.createElementNS(svg.namespaceURI, tag);
                for (const key in attribs) {
                    if (attribs[key] === undefined || attribs[key] === null) {
                        console.error(`Attribute '${key}' is undefined or null:`, attribs);
                    } else {
                        result.setAttribute(key, attribs[key].toString());
                    }
                }
                return result;
            }
            // // Draw every node
            for (const node of this.nodes) {
                let circle = gElem.querySelector(`circle[data-id="${node.id}"]`);
                if (!circle) {
                    circle = createSvgElem("circle", {
                        "data-id": node.id,
                        "r": node.radius,
                    });
                    gElem.appendChild(circle);
                }
                circle.setAttribute("cx", node.posX);
                circle.setAttribute("cy", node.posY);
                circle.setAttribute("fill", `rgba(88, 166, 92,${node.opacity.toFixed(3)})`);
            }
            // Draw every edge
            const edgeUpdateInterval = 10; // Adjust this value to control edge update frequency
            if (this.frameNumber % edgeUpdateInterval === 0) {
                this.edges.forEach(edge => edge.fade(this.fadeInPerFrame)); // Gradually make edges visible
            }

            // Draw every edge
            for (const edge of this.edges) {
                const a = edge.nodeA;
                const b = edge.nodeB;
                let dx = a.posX - b.posX;
                let dy = a.posY - b.posY;
                const mag = Math.hypot(dx, dy);
                if (mag > a.radius + b.radius) {
                    dx /= mag; // Make (dx, dy) a unit vector, pointing from B to A
                    dy /= mag;
                    const opacity = Math.min(Math.min(a.opacity, b.opacity), edge.opacity);
                    gElem.append(
                        createSvgElem("line", {
                            x1: a.posX - dx * a.radius,
                            y1: a.posY - dy * a.radius,
                            x2: b.posX + dx * b.radius,
                            y2: b.posY + dy * b.radius,
                            stroke: `rgba(88,166,92,${opacity.toFixed(3)})`,
                            "stroke-width": "0.0005",
                        })
                    );
                }
            }
        }
    }
    /*---- Minor graph object classes ----*/
    class GObject {
        constructor() {
            this.opacity = 0.0;
        }
        fade(delta) {
            this.opacity = Math.max(Math.min(this.opacity + delta, 1.0), 0.0);
        }
    }
    class GNode extends GObject {
        constructor(posX, // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
        posY, // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
        radius, // Radius of the node, a positive real number
        velX, // Horizontal velocity in relative units (not pixels)
        velY) {
            super();
            this.posX = posX;
            this.posY = posY;
            this.radius = radius;
            this.velX = velX;
            this.velY = velY;
            this.dPosX = 0;
            this.dPosY = 0;
        }
    }
    class GEdge extends GObject {
        constructor(nodeA, // A reference to the node object representing one side of the undirected edge
        nodeB) {
            super();
            this.nodeA = nodeA;
            this.nodeB = nodeB;
        }
    }
    /*---- Union-find data structure ----*/
    // A heavily stripped down version of the code originally from
    // https://www.nayuki.io/page/disjoint-set-data-structure .
    class DisjointSet {
        constructor(size) {
            this.parents = [];
            this.ranks = [];
            for (let i = 0; i < size; i++) {
                this.parents.push(i);
                this.ranks.push(0);
            }
        }
        mergeSets(i, j) {
            const repr0 = this.getRepr(i);
            const repr1 = this.getRepr(j);
            if (repr0 === repr1)
                return false;
            const cmp = this.ranks[repr0] - this.ranks[repr1];
            if (cmp >= 0) {
                if (cmp === 0)
                    this.ranks[repr0]++;
                this.parents[repr1] = repr0;
            }
            else
                this.parents[repr0] = repr1;
            return true;
        }
        getRepr(i) {
            if (this.parents[i] !== i)
                this.parents[i] = this.getRepr(this.parents[i]);
            return this.parents[i];
        }
    }
    /*---- Initialization ----*/
    main();
}, []);

return (
    <article><svg
      ref={svgRef}
      className="graph-background-svg"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        viewBox: "0 0 1 1",
        zIndex: -1, // Ensure it's behind other content
      }}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4c874f" />
          <stop offset="100%" stopColor="#4c874f" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGradient)" />
      <g></g>
    </svg></article>
  );
}

export default GraphBackground;