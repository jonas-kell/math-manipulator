<script setup lang="ts">
    import { OperatorConfig, useMacrosStore, useKeybindingsStore } from "./../functions";
    import { computed, ref } from "vue";
    const macrosStore = useMacrosStore();
    const keybindingsStore = useKeybindingsStore();

    const props = defineProps<{
        config: OperatorConfig;
    }>();

    const uuids = computed(() => {
        // access this to force re-computation
        macrosStore.lastUpdate;

        return macrosStore.availableMacroUUIDs(props.config);
    });
    function setOutputForMacro(uuid: string, output: string) {
        // set values
        macrosStore.setOutputForMacro(props.config, uuid, output);

        // bust own draw cache
        updated.value = Date.now();
    }
    function setTriggerForMacro(uuid: string, trigger: string) {
        // set values
        macrosStore.setTriggerForMacro(props.config, uuid, trigger);

        // own draw cache gets busted, becaus this will change macrosStore.lastUpdate
    }
    function createNewMacro() {
        macrosStore.makeSureMacroAvailable(props.config, "");
    }
    function removeMacroReference(uuid: string) {
        macrosStore.removeMacroFromStore(props.config, uuid);
    }
    type Draw = {
        trigger: string;
        output: string;
        uuid: string;
        allowedTrigger: boolean;
        triggerErrorMessage: string;
    }[];
    const updated = ref(Date.now());
    const drawSource = computed((): Draw => {
        // access this cache busting variable to trigger recalculations
        updated.value;

        let res = [] as Draw;
        uuids.value.forEach((uuid) => {
            const macro = macrosStore.getMacroByUUID(props.config, uuid);

            const allowedTriggerArray = macrosStore.triggerIsAllowed(macro.trigger);

            let newElem = {
                trigger: macro.trigger,
                output: macro.output,
                uuid: uuid,
                allowedTrigger: allowedTriggerArray[0],
                triggerErrorMessage: allowedTriggerArray[1],
            };

            res.push(newElem);
        });
        return res;
    });
</script>

<template>
    <div>
        <h3 style="margin-bottom: 0.2em">Macros:</h3>
        <button class="create-button" @click="createNewMacro()">+</button>
        <table>
            <template v-for="draw in drawSource">
                <tr>
                    <td>
                        <input
                            type="text"
                            :value="draw.trigger"
                            @input="($event) => setTriggerForMacro(draw.uuid, ($event.target as any)?.value)"
                            :key="draw.uuid + 'trigger'"
                            @focus="keybindingsStore.unSetActiveUUID"
                        />
                    </td>
                    <td>
                        <input
                            type="text"
                            :value="draw.output"
                            @input="($event) => setOutputForMacro(draw.uuid, ($event.target as any)?.value)"
                            :key="draw.uuid + 'output'"
                            @focus="keybindingsStore.unSetActiveUUID"
                        />
                    </td>
                    <td>
                        <button class="delete-button" @click="removeMacroReference(draw.uuid)">x</button>
                    </td>
                </tr>
                <tr v-if="!draw.allowedTrigger">
                    <td colspan="3">
                        {{ draw.triggerErrorMessage }}
                    </td>
                </tr>
            </template>
        </table>
    </div>
</template>

<style scoped>
    .delete-button {
        color: red;
        font-size: 0.8em;
    }
    .create-button {
        font-size: 0.8em;
    }
</style>
