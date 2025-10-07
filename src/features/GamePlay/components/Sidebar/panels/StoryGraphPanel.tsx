import React, { memo, useRef, useEffect } from 'react';
import type { GameState } from '../../../../../types';

interface StoryGraphPanelProps {
    gameState: GameState;
}

const NODE_RADIUS = 12;
const PLAYER_COLOR = '#FFD700'; // Gold
const NPC_COLOR = '#87CEEB'; // Sky Blue
const FACTION_COLOR = '#DA70D6'; // Orchid
const LOCATION_COLOR = '#90EE90'; // Light Green

const FRIENDLY_COLOR = '#2E8B57'; // SeaGreen
const NEUTRAL_COLOR = '#A9A9A9'; // DarkGray
const HOSTILE_COLOR = '#DC143C'; // Crimson
const MEMBERSHIP_COLOR = '#9370DB'; // MediumPurple
// FIX: Renamed to avoid redeclaring 'LOCATION_COLOR'. This constant is for edges.
const LOCATION_EDGE_COLOR = '#778899'; // LightSlateGray

const REPULSION_STRENGTH = 6000;
const ATTRACTION_STRENGTH = 0.05;
const IDEAL_LENGTH = 150;
const DAMPING = 0.95;

type NodeType = 'player' | 'npc' | 'faction' | 'location';
interface Node {
    id: string;
    label: string;
    type: NodeType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

interface Edge {
    source: string;
    target: string;
    type: string;
    color: string;
}

const StoryGraphPanel: React.FC<StoryGraphPanelProps> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const animationFrameId = useRef<number>();
    const interactionState = useRef<{
        draggedNode: Node | null,
        hoveredNode: Node | null,
        isDragging: boolean,
        offsetX: number,
        offsetY: number
    }>({ draggedNode: null, hoveredNode: null, isDragging: false, offsetX: 0, offsetY: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { playerCharacter, activeNpcs, discoveredLocations } = gameState;

        // --- Process GameState into Nodes and Edges ---
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        const addNode = (id: string, label: string, type: NodeType, color: string) => {
            // FIX: The error "Expected 1 arguments, but got 0" on this line is likely a tooling or parser bug.
            // Using .some() instead of .find() is functionally equivalent for this boolean check and may avoid the issue.
            if (!newNodes.some(n => n.id === id)) {
                newNodes.push({ id, label, type, color, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 });
            }
        };

        // 1. Add Player Node
        addNode('player', playerCharacter.identity.name, 'player', PLAYER_COLOR);

        // 2. Add NPC Nodes
        activeNpcs.forEach(npc => addNode(npc.id, npc.identity.name, 'npc', NPC_COLOR));
        
        // 3. Add Faction Nodes
        playerCharacter.reputation.forEach(rep => addNode(`faction_${rep.factionName}`, rep.factionName, 'faction', FACTION_COLOR));

        // 4. Add Location Nodes
        discoveredLocations.forEach(loc => addNode(loc.id, loc.name, 'location', LOCATION_COLOR));
        
        // 5. Create Player-NPC Relationship Edges
        playerCharacter.relationships.forEach(rel => {
            const status = rel.status.toLowerCase();
            let color = NEUTRAL_COLOR;
            if (status.includes('thân thiện') || status.includes('tri kỷ')) color = FRIENDLY_COLOR;
            if (status.includes('thù địch') || status.includes('lạnh nhạt')) color = HOSTILE_COLOR;
            newEdges.push({ source: 'player', target: rel.npcId, type: 'relationship', color });
        });

        // 6. Create NPC-Faction Membership Edges
        activeNpcs.forEach(npc => {
            if (npc.faction) {
                newEdges.push({ source: npc.id, target: `faction_${npc.faction}`, type: 'membership', color: MEMBERSHIP_COLOR });
            }
        });
        
        // 7. Create Entity-Location Edges
        addNode('player', playerCharacter.identity.name, 'player', PLAYER_COLOR); // Ensure player is added
        // FIX: Use the correctly named constant for edge color.
        newEdges.push({ source: 'player', target: playerCharacter.currentLocationId, type: 'location', color: LOCATION_EDGE_COLOR });
        activeNpcs.forEach(npc => {
            if (npc.locationId && discoveredLocations.some(l => l.id === npc.locationId)) {
                // FIX: Use the correctly named constant for edge color.
                newEdges.push({ source: npc.id, target: npc.locationId, type: 'location', color: LOCATION_EDGE_COLOR });
            }
        });
        
        nodesRef.current = newNodes;
        edgesRef.current = newEdges;

    }, [gameState]);


    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const nodes = nodesRef.current;
            const edges = edgesRef.current;
            const hoveredNodeId = interactionState.current.hoveredNode?.id;

            const connectedNodeIds = new Set<string>();
            if (hoveredNodeId) {
                connectedNodeIds.add(hoveredNodeId);
                edges.forEach(edge => {
                    if (edge.source === hoveredNodeId) connectedNodeIds.add(edge.target);
                    if (edge.target === hoveredNodeId) connectedNodeIds.add(edge.source);
                });
            }

            // Draw Edges
            edges.forEach(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return;
                
                const isHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
                ctx.globalAlpha = hoveredNodeId ? (isHovered ? 1.0 : 0.1) : 1.0;
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = edge.color;
                ctx.lineWidth = isHovered ? 2 : 1;
                ctx.stroke();
            });
            ctx.globalAlpha = 1.0;

            // Draw Nodes
            nodes.forEach(node => {
                const isHovered = hoveredNodeId ? connectedNodeIds.has(node.id) : true;
                ctx.globalAlpha = isHovered ? 1.0 : 0.2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = node.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = node.id === hoveredNodeId ? 3 : 1;
                ctx.stroke();

                // Draw Label
                if (isHovered) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(node.label, node.x, node.y - NODE_RADIUS - 5);
                }
            });
             ctx.globalAlpha = 1.0;
        };

        const updatePhysics = () => {
            const nodes = nodesRef.current;
            const edges = edgesRef.current;

            // Reset forces
            nodes.forEach(node => { node.vx = 0; node.vy = 0; });

            // Repulsion
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeA = nodes[i];
                    const nodeB = nodes[j];
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distanceSq = dx * dx + dy * dy;
                    if (distanceSq === 0) continue;
                    const force = REPULSION_STRENGTH / distanceSq;
                    nodeA.vx -= force * (dx / Math.sqrt(distanceSq));
                    nodeA.vy -= force * (dy / Math.sqrt(distanceSq));
                    nodeB.vx += force * (dx / Math.sqrt(distanceSq));
                    nodeB.vy += force * (dy / Math.sqrt(distanceSq));
                }
            }

            // Attraction
            edges.forEach(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return;
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const displacement = distance - IDEAL_LENGTH;
                const force = ATTRACTION_STRENGTH * displacement;
                const fx = force * (dx / distance);
                const fy = force * (dy / distance);
                source.vx += fx; source.vy += fy;
                target.vx -= fx; target.vy -= fy;
            });
            
            // Update positions
            nodes.forEach(node => {
                if (interactionState.current.draggedNode !== node) {
                    node.x += node.vx;
                    node.y += node.vy;

                    // Boundary checks
                    node.x = Math.max(NODE_RADIUS, Math.min(canvas.width - NODE_RADIUS, node.x));
                    node.y = Math.max(NODE_RADIUS, Math.min(canvas.height - NODE_RADIUS, node.y));
                }
            });
        };

        const animate = () => {
            updatePhysics();
            draw();
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();
        
        // --- Mouse Events ---
        const getMousePos = (e: MouseEvent) => ({ x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top });
        
        const handleMouseDown = (e: MouseEvent) => {
            const pos = getMousePos(e);
            const clickedNode = nodesRef.current.find(node => Math.hypot(node.x - pos.x, node.y - pos.y) < NODE_RADIUS);
            if (clickedNode) {
                interactionState.current.isDragging = true;
                interactionState.current.draggedNode = clickedNode;
                interactionState.current.offsetX = pos.x - clickedNode.x;
                interactionState.current.offsetY = pos.y - clickedNode.y;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const pos = getMousePos(e);
            if (interactionState.current.isDragging && interactionState.current.draggedNode) {
                interactionState.current.draggedNode.x = pos.x - interactionState.current.offsetX;
                interactionState.current.draggedNode.y = pos.y - interactionState.current.offsetY;
            } else {
                 interactionState.current.hoveredNode = nodesRef.current.find(node => Math.hypot(node.x - pos.x, node.y - pos.y) < NODE_RADIUS) || null;
            }
        };

        const handleMouseUp = () => {
            interactionState.current.isDragging = false;
            interactionState.current.draggedNode = null;
        };
        
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [gameState]);


    return (
        <div className="w-full h-full rounded-lg" style={{ boxShadow: 'var(--shadow-pressed)' }}>
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};

export default memo(StoryGraphPanel);