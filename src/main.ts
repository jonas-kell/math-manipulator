import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles/styles.scss";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import Main from "./Main.vue";

const routes = [
    // All components need to be provided with Main.vue
    { path: "/", component: Main, name: "main" },
    {
        path: "/help",
        component: Main,
        name: "help",
    },
    {
        path: "/empty",
        component: Main,
        name: "empty",
    },
    {
        path: "/stored",
        component: Main,
        name: "stored",
    },
    {
        path: "/:pathMatch(.*)*",
        redirect: (_to: any) => {
            return { path: "/" };
        },
    },
] as any;
const router = createRouter({
    history: createWebHashHistory(""),
    routes,
    scrollBehavior(_to, _from, _savedPosition) {
        return { top: 0, behavior: "smooth" };
    },
});

createApp(App).use(createPinia()).use(router).mount("#app");
