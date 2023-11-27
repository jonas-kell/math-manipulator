<script setup lang="ts">
    import { ref } from "vue";
    import Welcome from "./pages/Welcome.vue";
    import Help from "./pages/Help.vue";
    import Interactive from "./pages/Interactive.vue";

    import { useRouteStore, generateOperatorConfig } from "./functions";

    const routeStore = useRouteStore();

    const config = ref(generateOperatorConfig());
</script>

<template>
    <template v-if="routeStore.mode == 'main'"><Welcome /></template>
    <template v-else-if="routeStore.mode == 'help'"><Help /></template>
    <template v-else-if="routeStore.mode == 'empty' || routeStore.mode == 'stored'">
        <Interactive :show-hints="routeStore.mode == 'empty'" :config="config" />
    </template>
</template>

<style scoped></style>
