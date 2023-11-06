import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles/styles.scss";
import App from "./App.vue";

createApp(App).use(createPinia()).mount("#app");
