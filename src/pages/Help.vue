<script setup lang="ts">
    import EquationUtility from "./../components/EquationUtility.vue";
    import { HelpElement } from "./helpElement";
    import helpDatabaseImport from "./helpDatabase.json";
    const helpDatabase = helpDatabaseImport as HelpElement[];

    // import the examples into memory storage
    import { OperatorConfig, PermanenceStorageModes, generateOperatorConfig, usePermanenceStore } from "./../functions";
    import { computed } from "vue";
    const permanenceStore = usePermanenceStore();
    permanenceStore.setStorageModeTo(PermanenceStorageModes.memory);

    const elements = computed((): { element: HelpElement; config: OperatorConfig }[] => {
        let outArray: { element: HelpElement; config: OperatorConfig }[] = [];

        // normally un-nice to do in computed, but this only is executed once, because the only input is a json import
        helpDatabase.forEach((elem) => {
            for (const uuid in elem.storage) {
                const value = elem.storage[uuid];
                if (value != undefined) {
                    permanenceStore.abstractStoreImplementationSet(uuid, value);
                }
            }

            outArray.push({
                config: generateOperatorConfig(elem.mainUuid, elem.variablesUuid), // TODO replace Macro UUID and insert here
                element: elem,
            });
        });

        return outArray;
    });

    const VITE_RENDER_ROUTER_LINKS = import.meta.env.VITE_RENDER_ROUTER_LINKS != "0";
</script>

<template>
    <h1>Math Manipulator: Help Playground</h1>

    <p v-if="VITE_RENDER_ROUTER_LINKS">Head Back to the <router-link to="/">Welcome Page</router-link></p>

    <p>Here a bunch of pre-configured operations and effects are presented.</p>
    <p>The help is interactive. Feel free to make changes and experiment at any point.</p>
    <p>Help can be reset with refreshing the page</p>

    <template v-for="elem in elements">
        <h3>{{ elem.element.title }}</h3>
        <p style="white-space: pre-line">{{ elem.element.description }}</p>
        <EquationUtility
            :config="elem.config"
            :show-variables="elem.element.showVariables"
            :show-macros="elem.element.showMacros"
        />
    </template>
    <div style="width: 100%; min-height: 40vh"></div>
</template>
