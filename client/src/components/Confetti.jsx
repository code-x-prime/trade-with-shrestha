'use client';

import { useEffect, useRef } from 'react';

export default function Confetti({ active = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const confetti = [];
    const confettiCount = 150;
    const gravity = 0.5;
    const terminalVelocity = 5;
    const drag = 0.075;
    const colors = [
      { front: '#4A50B0', back: '#5C64D7' },
      { front: '#10B981', back: '#34D399' },
      { front: '#F59E0B', back: '#FBBF24' },
      { front: '#EF4444', back: '#F87171' },
      { front: '#8B5CF6', back: '#A78BFA' },
    ];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const randomRange = (min, max) => Math.random() * (max - min) + min;

    const initConfetti = () => {
      for (let i = 0; i < confettiCount; i++) {
        confetti.push({
          color: colors[Math.floor(randomRange(0, colors.length))],
          dimensions: {
            x: randomRange(10, 20),
            y: randomRange(10, 20),
          },
          position: {
            x: randomRange(0, canvas.width),
            y: randomRange(-canvas.height, 0),
          },
          rotation: randomRange(0, 2 * Math.PI),
          scale: {
            x: 1,
            y: 1,
          },
          velocity: {
            x: randomRange(-25, 25),
            y: randomRange(0, -50),
          },
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((confetto, index) => {
        const width = confetto.dimensions.x * confetto.scale.x;
        const height = confetto.dimensions.y * confetto.scale.y;

        ctx.translate(confetto.position.x, confetto.position.y);
        ctx.rotate(confetto.rotation);

        confetto.scale.y = Math.cos(confetto.position.y * 0.1);
        ctx.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

        ctx.fillRect(-width / 2, -height / 2, width, height);

        ctx.resetTransform();

        confetto.velocity.x -= confetto.velocity.x * drag;
        confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
        confetto.velocity.x += Math.cos(confetto.position.y * 0.1) * 0.05;

        confetto.position.x += confetto.velocity.x;
        confetto.position.y += confetto.velocity.y;
        confetto.rotation += confetto.velocity.x * 0.1;

        if (confetto.position.y >= canvas.height) {
          confetti.splice(index, 1);
        }
      });

      if (confetti.length > 0) {
        requestAnimationFrame(render);
      }
    };

    initConfetti();
    render();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

