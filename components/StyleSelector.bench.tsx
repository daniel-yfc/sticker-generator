import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockT = (key: string) => key;
const mockStylesTranslation = Object.fromEntries(
  STYLES.map(s => [s.id, { name: `Style ${s.id}`, features: 'features' }])
);

describe('StyleSelector render performance', () => {
  bench('grid mode render', () => {
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={() => {}}
        disabled={false}
        t={mockT}
        stylesTranslation={mockStylesTranslation}
        mode="grid"
      />
    );
  });

  bench('sidebar mode render', () => {
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={() => {}}
        disabled={false}
        t={mockT}
        stylesTranslation={mockStylesTranslation}
        mode="sidebar"
      />
    );
  });
});
