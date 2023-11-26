<script setup lang="ts">
    import EquationUtility from "./../components/EquationUtility.vue";
    interface HelpElement {
        title: string;
        description: string;
        storage: { [key: string]: string };
        showVariables: boolean;
        mainUuid: string;
        variablesUuid: string;
    }
    import helpDatabaseImport from "./helpDatabase.json";
    const helpDatabase = helpDatabaseImport as HelpElement[];

    // import the examples into memory storage
    import { PermanenceStorageModes, usePermanenceStore } from "./../functions";
    const permanenceStore = usePermanenceStore();
    permanenceStore.setStorageModeTo(PermanenceStorageModes.memory);

    helpDatabase.forEach((elem) => {
        for (const uuid in elem.storage) {
            const value = elem.storage[uuid];
            permanenceStore.abstractStoreImplementationSet(uuid, value);
        }
    });

    const VITE_RENDER_ROUTER_LINKS = import.meta.env.VITE_RENDER_ROUTER_LINKS != "0";
</script>

<template>
    <h1>Math Manipulator: Help Playground</h1>

    <p v-if="VITE_RENDER_ROUTER_LINKS">Head Back to the <router-link to="/">Welcome Page</router-link></p>

    <template v-for="elem in helpDatabase">
        <h3>{{ elem.title }}</h3>
        <p>{{ elem.description }}</p>
        <EquationUtility
            :first-line-uuid="elem.mainUuid"
            :variable-list-uuid="elem.variablesUuid"
            :show-variables="elem.showVariables"
        />
    </template>
</template>
