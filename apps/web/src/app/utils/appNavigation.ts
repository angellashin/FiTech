export type AppScreen =
  | 'login'
  | 'home'
  | 'setup'
  | 'preview'
  | 'session'
  | 'complete'
  | 'profile'
  | 'history'
  | 'progress'
  | 'routines';

export interface AppNavigationState {
  current: AppScreen;
  stack: AppScreen[];
}

export type AppNavigationAction =
  | { type: 'push'; screen: AppScreen }
  | { type: 'replace'; screen: AppScreen }
  | { type: 'reset'; screen: AppScreen }
  | { type: 'back' };

export const createNavigationState = (initialScreen: AppScreen): AppNavigationState => ({
  current: initialScreen,
  stack: [],
});

export const getBackTarget = (state: AppNavigationState): AppScreen | null =>
  state.stack.length > 0 ? state.stack[state.stack.length - 1] : null;

export const appNavigationReducer = (
  state: AppNavigationState,
  action: AppNavigationAction,
): AppNavigationState => {
  switch (action.type) {
    case 'push':
      if (state.current === action.screen) return state;
      return {
        current: action.screen,
        stack: [...state.stack, state.current],
      };
    case 'replace':
      return {
        ...state,
        current: action.screen,
      };
    case 'reset':
      return createNavigationState(action.screen);
    case 'back': {
      const target = getBackTarget(state);
      if (!target) return state;
      return {
        current: target,
        stack: state.stack.slice(0, -1),
      };
    }
    default:
      return state;
  }
};
