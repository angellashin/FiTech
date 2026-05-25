import { describe, expect, it } from 'vitest';
import { appNavigationReducer, createNavigationState, getBackTarget } from './appNavigation';

describe('appNavigationReducer', () => {
  it('returns to the exact widget source instead of always going home', () => {
    const fromHistory = appNavigationReducer(createNavigationState('home'), {
      type: 'push',
      screen: 'history',
    });
    const preview = appNavigationReducer(fromHistory, { type: 'push', screen: 'preview' });

    expect(preview.stack).toEqual(['home', 'history']);
    expect(getBackTarget(preview)).toBe('history');
    expect(appNavigationReducer(preview, { type: 'back' })).toEqual({
      current: 'history',
      stack: ['home'],
    });
  });

  it('keeps the generated workout flow back-stack in order', () => {
    const setup = appNavigationReducer(createNavigationState('home'), {
      type: 'push',
      screen: 'setup',
    });
    const preview = appNavigationReducer(setup, { type: 'push', screen: 'preview' });
    const session = appNavigationReducer(preview, { type: 'push', screen: 'session' });

    expect(appNavigationReducer(session, { type: 'back' })).toEqual(preview);
    expect(appNavigationReducer(preview, { type: 'back' })).toEqual(setup);
    expect(appNavigationReducer(setup, { type: 'back' })).toEqual(createNavigationState('home'));
  });

  it('can replace or reset without adding fake history entries', () => {
    const setup = appNavigationReducer(createNavigationState('home'), {
      type: 'push',
      screen: 'setup',
    });
    const complete = appNavigationReducer(setup, { type: 'replace', screen: 'complete' });
    const login = appNavigationReducer(complete, { type: 'reset', screen: 'login' });

    expect(complete).toEqual({ current: 'complete', stack: ['home'] });
    expect(login).toEqual(createNavigationState('login'));
  });

  it('does not duplicate history when pushing the current screen', () => {
    const home = createNavigationState('home');
    expect(appNavigationReducer(home, { type: 'push', screen: 'home' })).toBe(home);
  });
});
