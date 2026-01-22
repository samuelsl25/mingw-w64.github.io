import React from 'react';
import { Composition } from 'remotion';
import { FailureFlow } from './FailureFlow';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="FailureFlow"
        component={FailureFlow}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
