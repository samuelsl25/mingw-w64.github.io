import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation - spring-based entrance
  const titleProgress = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleScale = interpolate(titleProgress, [0, 1], [0.5, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-50, 0]);

  // Subtitle animation - delayed spring entrance
  const subtitleProgress = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  // Background color animation
  const bgHue = interpolate(frame, [0, 150], [220, 280], {
    extrapolateRight: 'clamp',
  });

  // Floating particles animation
  const particles = Array.from({ length: 20 }, (_, i) => {
    const delay = i * 3;
    const particleProgress = spring({
      frame: frame - delay,
      fps,
      config: {
        damping: 200,
      },
    });

    const x = interpolate(
      particleProgress,
      [0, 1],
      [Math.random() * 1920, Math.random() * 1920]
    );
    const y = interpolate(
      frame + i * 10,
      [0, 150],
      [1080 + 50, -50],
      {
        extrapolateRight: 'clamp',
      }
    );

    const opacity = interpolate(particleProgress, [0, 0.5, 1], [0, 0.8, 0.3]);
    const size = 10 + Math.random() * 20;

    return { x, y, opacity, size, key: i };
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${bgHue}, 70%, 50%), hsl(${
          bgHue + 40
        }, 60%, 40%))`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.key}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            opacity: particle.opacity,
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
          }}
        />
      ))}

      {/* Content container */}
      <div
        style={{
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            opacity: titleOpacity,
            transform: `scale(${titleScale}) translateY(${titleY}px)`,
            textShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          Remotion Demo
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 48,
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '20px 0 0 0',
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
          }}
        >
          Create videos with React
        </p>

        {/* Feature highlights - staggered entrance */}
        <div
          style={{
            marginTop: 60,
            display: 'flex',
            gap: 40,
            justifyContent: 'center',
          }}
        >
          {['Programmatic', 'Scalable', 'Beautiful'].map((text, i) => {
            const featureProgress = spring({
              frame: frame - 30 - i * 8,
              fps,
              config: {
                damping: 100,
                stiffness: 200,
              },
            });

            const featureOpacity = interpolate(featureProgress, [0, 1], [0, 1]);
            const featureScale = interpolate(featureProgress, [0, 1], [0.5, 1]);

            return (
              <div
                key={text}
                style={{
                  padding: '20px 40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 15,
                  backdropFilter: 'blur(10px)',
                  fontSize: 32,
                  fontWeight: '600',
                  color: 'white',
                  opacity: featureOpacity,
                  transform: `scale(${featureScale})`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
              >
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
