<script setup lang="ts">
    const VITE_RENDER_ROUTER_LINKS = import.meta.env.VITE_RENDER_ROUTER_LINKS != "0";
</script>

<template>
    <h1>Math Manipulator: Help Playground</h1>

    <p v-if="VITE_RENDER_ROUTER_LINKS">Head Back to the <router-link to="/">Welcome Page</router-link></p>

    TO BE DONE
</template>
