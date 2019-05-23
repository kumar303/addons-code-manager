import React from 'react';
import { storiesOf } from '@storybook/react';

import ContentShell from '../src/components/FullscreenGrid/ContentShell';
import FullscreenGrid, {
  Header,
  PanelAttribs,
} from '../src/components/FullscreenGrid';
import ToggleButton from '../src/components/ToggleButton';
import {
  generateParagraphs,
  renderWithStoreAndRouter,
  rootAttributeParams,
} from './utils';

const getParams = () => rootAttributeParams({ fullscreen: true });

storiesOf('FullscreenGrid', module)
  .add(
    'default',
    () => {
      return renderWithStoreAndRouter(
        <FullscreenGrid>
          <Header className="FullscreenGridStory-Header">Header</Header>
          <ContentShell
            altSidePanel={PanelAttribs.altSidePanel}
            altSidePanelClass="FullscreenGridStory-altSidePanel"
            className="FullscreenGridStory-content"
            mainSidePanel={PanelAttribs.mainSidePanel}
            mainSidePanelClass="FullscreenGridStory-mainSidePanel"
          >
            Content
          </ContentShell>
        </FullscreenGrid>,
      );
    },
    getParams(),
  )
  .add(
    'long content',
    () => {
      const someText = generateParagraphs(10);

      return renderWithStoreAndRouter(
        <FullscreenGrid>
          <Header className="FullscreenGridStory-Header">Header</Header>
          <ContentShell altSidePanel={someText} mainSidePanel={someText}>
            {someText}
          </ContentShell>
        </FullscreenGrid>,
      );
    },
    getParams(),
  );
