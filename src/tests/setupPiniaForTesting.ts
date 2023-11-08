import { setActivePinia, createPinia } from "pinia";

// creates a fresh pinia and makes it active
// so it's automatically picked up by any useStore() call
// without having to pass it to it: `useStore(pinia)`
export default () => setActivePinia(createPinia());
