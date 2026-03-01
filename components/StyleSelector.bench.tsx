import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockSelect = () => {};
const mockT = (k: string) => k;
const mockStylesTranslation = {};

describe('StyleSelector performance', () => {
  bench('render StyleSelector grid mode', () => {
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={mockStylesTranslation}
        mode="grid"
      />
    );
  });

  bench('render StyleSelector sidebar mode', () => {
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={mockStylesTranslation}
        mode="sidebar"
      />
    );
  });
});
