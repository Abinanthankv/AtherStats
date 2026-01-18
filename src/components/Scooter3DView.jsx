import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import scooterImg from '../assets/scooter.png';
import '../Scooter3D.css';

const Scooter3DView = () => {
    const containerRef = useRef(null);

    // Motion values for mouse position
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs for rotation
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-20, 20]), { stiffness: 150, damping: 20 });

    // Parallax motion for different layers
    const layer1X = useSpring(useTransform(x, [-0.5, 0.5], [-30, 30]), { stiffness: 150, damping: 20 });
    const layer1Y = useSpring(useTransform(y, [-0.5, 0.5], [-20, 20]), { stiffness: 150, damping: 20 });

    const textX = useSpring(useTransform(x, [-0.5, 0.5], [50, -50]), { stiffness: 100, damping: 25 });

    const handleMouseMove = (event) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Normalize coordinates to -0.5 to 0.5
        const xPct = (mouseX / width) - 0.5;
        const yPct = (mouseY / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div
            className="scooter-3d-container"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="scooter-3d-wrapper"
                style={{
                    rotateX,
                    rotateY,
                }}
            >
                {/* Background Text Layer */}
                <motion.div
                    className="depth-layer"
                    style={{ x: textX }}
                >
                    <span className="depth-text">ATHER 450X</span>
                </motion.div>

                {/* Glow Layer */}
                <div className="scooter-bg-glow" />

                {/* Shadow Layer */}
                <div className="scooter-shadow" />

                {/* Main Scooter Image Layer */}
                <motion.div
                    className="depth-layer"
                    style={{
                        x: layer1X,
                        y: layer1Y,
                    }}
                >
                    <img
                        src={scooterImg}
                        alt="Ather Scooter"
                        className="scooter-image"
                    />
                </motion.div>

                {/* Visual Depth Hints */}
                <div className="scooter-3d-ui-elements" style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.5 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <div style={{ width: '40px', height: '1px', background: 'var(--primary)' }}></div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>3D Depth View</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Scooter3DView;
