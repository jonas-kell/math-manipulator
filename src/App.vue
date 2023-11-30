<script setup lang="ts">
    import { computed } from "vue";
    import { usePermanenceStore } from "./functions";

    // boot nothing of the application until the storage is ready
    const storageReady = computed(() => {
        return usePermanenceStore().storageReady;
    });
</script>

<template>
    <router-view v-if="storageReady"></router-view>
</template>

<style scoped></style>
