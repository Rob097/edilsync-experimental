/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

describe('SelectTrigger', () => {
  it('keeps long selected labels inside the trigger width constraints', () => {
    render(
      <Select defaultValue="company-1">
        <SelectTrigger data-testid="company-select-trigger">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company-1">
            Impresa con denominazione molto molto lunga che non deve allargare la modale oltre il viewport
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByTestId('company-select-trigger');

    expect(trigger.className).toContain('min-w-0');
    expect(trigger.className).toContain('overflow-hidden');
    expect(trigger.className).toContain('[&>span]:truncate');
  });
});