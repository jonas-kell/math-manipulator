<script setup lang="ts">
    import EquationUtility from "./../components/EquationUtility.vue";
    import { OperatorConfig, usePermanenceStore } from "./../functions";
    const VITE_MODE = import.meta.env.MODE;

    const props = defineProps<{
        showHints: boolean;
        config: OperatorConfig;
    }>();

    const permanenceStore = usePermanenceStore();
    const copySessionStorageToClipboard = () => {
        let text = permanenceStore.dumpSessionStorageObjectToString(props.config);

        navigator.clipboard
            .writeText(text)
            .then(() => {
                console.log("Session Storage copied to clipboard");
            })
            .catch((err) => {
                console.error("Could not copy text: ", err);
            });
    };
</script>

<template>
    <template v-if="props.showHints">
        <p>Try:</p>
        <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
        <p>(You can click parts of the rendered function to invoke actions)</p>
    </template>
    <EquationUtility :config="config" :show-variables="true" :show-macros="true" />
    <div style="width: 100%; min-height: 40vh">
        <button @click="copySessionStorageToClipboard" style="float: right" v-if="VITE_MODE == 'development'">
            Session storage to Clipboard
        </button>
    </div>
</template>
