import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Definición de las rutas de flujo con coordenadas aproximadas basadas en la imagen
const flowPaths = [
  // Ruta 1: Cliente -> Call Center -> Asesores -> Areas del Banco
  {
    id: 'path1',
    color: '#FF4444',
    nodes: [
      { x: 315, y: 410, label: 'Cliente' },
      { x: 515, y: 555, label: 'Call Center' },
      { x: 515, y: 240, label: 'Asesores' },
      { x: 1135, y: 390, label: 'Areas del Banco' },
    ],
  },
  // Ruta 2: Cliente -> WhatsApp -> SOS Digital -> Areas del Banco
  {
    id: 'path2',
    color: '#FF8844',
    nodes: [
      { x: 315, y: 410, label: 'Cliente' },
      { x: 790, y: 410, label: 'WhatsApp' },
      { x: 790, y: 255, label: 'SOS Digital' },
      { x: 1135, y: 390, label: 'Areas del Banco' },
    ],
  },
  // Ruta 3: WhatsApp -> Correo -> Product Owner -> Gerentes de Productos
  {
    id: 'path3',
    color: '#FFAA44',
    nodes: [
      { x: 790, y: 410, label: 'WhatsApp' },
      { x: 987, y: 255, label: 'Correo' },
      { x: 990, y: 105, label: 'Product Owner' },
      { x: 715, y: 105, label: 'Gerentes' },
    ],
  },
  // Ruta 4: Formulario -> Areas del Banco -> Gerentes de Productos
  {
    id: 'path4',
    color: '#FF6644',
    nodes: [
      { x: 795, y: 575, label: 'Formulario' },
      { x: 1135, y: 390, label: 'Areas del Banco' },
      { x: 715, y: 105, label: 'Gerentes' },
    ],
  },
];

interface FailureParticleProps {
  path: typeof flowPaths[0];
  delay: number;
}

const FailureParticle: React.FC<FailureParticleProps> = ({ path, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calcular el progreso de la animación con retraso
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 200,
    },
  });

  // Calcular la posición actual a lo largo del path
  const totalSegments = path.nodes.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentSegment = Math.floor(segmentProgress);
  const segmentFraction = segmentProgress - currentSegment;

  if (currentSegment >= totalSegments) {
    // La partícula ha llegado al final
    const lastNode = path.nodes[path.nodes.length - 1];
    return (
      <div
        style={{
          position: 'absolute',
          left: lastNode.x,
          top: lastNode.y,
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: path.color,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 20px ${path.color}, 0 0 40px ${path.color}`,
          opacity: interpolate(frame - delay - fps * 0.8, [0, 30], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    );
  }

  if (currentSegment < 0) {
    return null;
  }

  // Interpolación entre el nodo actual y el siguiente
  const startNode = path.nodes[currentSegment];
  const endNode = path.nodes[currentSegment + 1];

  const x = interpolate(segmentFraction, [0, 1], [startNode.x, endNode.x]);
  const y = interpolate(segmentFraction, [0, 1], [startNode.y, endNode.y]);

  // Efecto de pulso
  const pulseScale = interpolate(
    Math.sin((frame - delay) * 0.3),
    [-1, 1],
    [0.8, 1.2]
  );

  return (
    <>
      {/* Partícula principal */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: path.color,
          transform: `translate(-50%, -50%) scale(${pulseScale})`,
          boxShadow: `0 0 20px ${path.color}, 0 0 40px ${path.color}`,
          zIndex: 10,
        }}
      />
      {/* Estela */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: path.color,
          opacity: 0.3,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(10px)',
          zIndex: 9,
        }}
      />
    </>
  );
};

export const FailureFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in al inicio
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a1a',
      }}
    >
      {/* Imagen de fondo del diagrama */}
      <Img
        src="/flow-diagram.png"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: fadeIn,
        }}
      />

      {/* Overlay semi-transparente para mejorar la visibilidad de las partículas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: fadeIn,
        }}
      />

      {/* Título */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)',
          opacity: fadeIn,
        }}
      >
        Flujo de Fallos - App Móvil
      </div>

      {/* Animación de partículas para cada ruta */}
      {flowPaths.map((path, pathIndex) => {
        // Crear múltiples oleadas de fallos para cada ruta
        const waves = [0, 60, 120, 180, 240, 300];
        return waves.map((waveDelay, waveIndex) => (
          <FailureParticle
            key={`${path.id}-${waveIndex}`}
            path={path}
            delay={waveDelay + pathIndex * 15}
          />
        ));
      })}

      {/* Leyenda */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 60,
          padding: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 10,
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 15,
          }}
        >
          Tipos de Fallos:
        </div>
        {flowPaths.map((path) => (
          <div
            key={path.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: path.color,
                marginRight: 10,
                boxShadow: `0 0 10px ${path.color}`,
              }}
            />
            <span
              style={{
                color: '#ffffff',
                fontSize: 18,
              }}
            >
              {path.nodes[0].label} → {path.nodes[path.nodes.length - 1].label}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
