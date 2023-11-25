import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const Modes = ["main", "help", "empty", "stored"] as ["main", "help", "empty", "stored"];
type ModesType = (typeof Modes)[number];

export const useRouteStore = defineStore("route", () => {
    const mode = ref("router" as ModesType);

    // overwrite rootProps with values set by routing
    const route = useRoute();
    watch(route, () => {
        handleRouteChange();
    });
    let handleRouteChange = () => {
        if (route.name != undefined && route.name != null) {
            if (Modes.includes(String(route.name) as any)) {
                mode.value = String(route.name) as ModesType;
            } else {
                console.error(`Not supported value for mainMode ${String(route.name)}`);
            }
        }
    };
    handleRouteChange();

    // overwrite rootProps with values set-able in html (initializer if external route control is not available)
    if ((window as any).mainMode != undefined && (window as any).mainMode != null) {
        if (Modes.includes((window as any).mainMode)) {
            mode.value = (window as any).mainMode;
        } else {
            console.error(`Not supported value for mainMode ${(window as any).mainMode}`);
        }
    }

    return {
        mode,
    };
});
