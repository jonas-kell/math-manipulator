<script setup lang="ts">
    import Welcome from "./pages/Welcome.vue";
    import Help from "./pages/Help.vue";
    import Interactive from "./pages/Interactive.vue";

    import { useRouteStore } from "./functions";

    const routeStore = useRouteStore();
</script>

<template>
    <template v-if="routeStore.mode == 'main'"><Welcome /></template>
    <template v-else-if="routeStore.mode == 'help'"><Help /></template>
    <template v-else-if="routeStore.mode == 'empty' || routeStore.mode == 'stored'">
        <Interactive
            :show-hints="routeStore.mode == 'empty'"
            first-line-uuid="MAIN_UUID"
            variable-list-uuid="MAIN_VARIABLE_LIST_UUID"
        />
    </template>
</template>

<style scoped></style>
