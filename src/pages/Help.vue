<script setup lang="ts">
    import EquationUtility from "./../components/EquationUtility.vue";
    import { HelpElement } from "./helpElement";
    import helpDatabaseImport from "./helpDatabase.json";
    const helpDatabase = helpDatabaseImport as HelpElement[];

    // import the examples into memory storage
    import { PermanenceStorageModes, usePermanenceStore } from "./../functions";
    const permanenceStore = usePermanenceStore();
    permanenceStore.setStorageModeTo(PermanenceStorageModes.memory);

    helpDatabase.forEach((elem) => {
        for (const uuid in elem.storage) {
            const value = elem.storage[uuid];
            if (value != undefined) {
                permanenceStore.abstractStoreImplementationSet(uuid, value);
            }
        }
    });

    const VITE_RENDER_ROUTER_LINKS = import.meta.env.VITE_RENDER_ROUTER_LINKS != "0";
</script>

<template>
    <h1>Math Manipulator: Help Playground</h1>

    <p v-if="VITE_RENDER_ROUTER_LINKS">Head Back to the <router-link to="/">Welcome Page</router-link></p>

    <p>Here a bunch of pre-configured operations and effects are presented.</p>
    <p>The help is interactive. Feel free to make changes and experiment at any point.</p>
    <p>Help can be reset with refreshing the page</p>

    <template v-for="elem in helpDatabase">
        <h3>{{ elem.title }}</h3>
        <p style="white-space: pre-line">{{ elem.description }}</p>
        <EquationUtility
            :first-line-uuid="elem.mainUuid"
            :variable-list-uuid="elem.variablesUuid"
            :show-variables="elem.showVariables"
        />
    </template>
    <div style="width: 100%; min-height: 40vh"></div>
</template>
