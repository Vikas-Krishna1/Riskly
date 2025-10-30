// ✅ SHARED STATE - Lives outside React
export let user: any = null;
export let loading = true;

// ✅ SUBSCRIPTION SYSTEM
type Listener = () => void;
const listeners = new Set<Listener>();

// Update state and notify everyone
export const setState = (newUser: any, newLoading: boolean) => {
  user = newUser;
  loading = newLoading;
  notifyListeners();
};

// Tell all components to re-render
export const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Subscribe a component
export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  
  // ✅ FIX: Return a function that returns void, not boolean
  return () => {
    listeners.delete(listener);
  };
};