# Demo Video - Remotion Project

This is a demo video project created with [Remotion](https://remotion.dev), showcasing beautiful animations and programmatic video creation.

## Features

- **Spring-based animations** - Smooth, physics-based motion
- **Floating particles** - Dynamic background effects
- **Staggered entrances** - Multiple elements animating in sequence
- **Gradient backgrounds** - Animated color transitions
- **Modern design** - Glass morphism and blur effects

## Getting Started

### Development

Start the Remotion Studio to preview and edit the video:

```bash
npm start
```

This will open the Remotion Studio in your browser at http://localhost:3000

### Rendering

To render the video to an MP4 file:

```bash
npm run build
```

The output will be saved to `out/demo.mp4`

## Project Structure

- `src/index.ts` - Entry point that registers the root component
- `src/Root.tsx` - Defines the composition(s) with duration, FPS, and dimensions
- `src/Demo.tsx` - The main demo video component with all animations

## Customization

You can customize the video by editing `src/Demo.tsx`:

- **Duration**: Change `durationInFrames` in `src/Root.tsx` (currently 150 frames = 5 seconds at 30fps)
- **Resolution**: Modify `width` and `height` in `src/Root.tsx` (currently 1920x1080)
- **Animations**: Adjust spring configurations, interpolations, and timing in `src/Demo.tsx`
- **Colors**: Change the gradient hues and particle colors
- **Content**: Update text, add more elements, or create entirely new scenes

## Learn More

- [Remotion Documentation](https://remotion.dev/docs)
- [Remotion Best Practices](../.skills/remotion-best-practices/SKILL.md)
- [Animation Techniques](../.skills/remotion-best-practices/rules/animations.md)
- [Timing and Interpolation](../.skills/remotion-best-practices/rules/timing.md)
