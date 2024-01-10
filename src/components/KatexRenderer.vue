<script setup lang="ts">
    import katex from "katex";
    import { ref, watch, onBeforeMount, onMounted, computed, onBeforeUnmount } from "vue";
    import { Operator, useRouteStore, useSelectFunctionStore } from "../functions";
    import { katexMacros } from "./katexMacros";

    const selectFunctionStore = useSelectFunctionStore();

    const props = defineProps<{
        katexInput: string;
        uuidRefsToProcess: string[]; // make sure the uuids that are put into this always start with a letter!! Our default is "ref_{{uuid}}"
        rendererUuid: string;
    }>();

    const emit = defineEmits(["selected", "selected-additional"]);

    const containerId = computed(() => {
        return Operator.UUIDRefFromUUID(props.rendererUuid);
    });
    const selectionRef = ref(null as string | null);
    const additionalSelectionRefs = ref(new Set<string>());
    const additionalSelectionUUIDs = ref(new Set<string>());

    const clickListenerWrapper = (UUIDRef: string) => {
        return (event: MouseEvent) => {
            event.stopPropagation();

            selectUUIDProgrammatically(UUIDRef, false);
        };
    };
    const rightClickListenerWrapper = (UUIDRef: string) => {
        return (event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();

            selectUUIDProgrammatically(UUIDRef, true);
        };
    };

    const selectUUIDProgrammatically = (UUIDRef: string, additional: boolean = false) => {
        const uuid = Operator.UUIDFromUUIDRef(UUIDRef);
        let unselect = false;

        if (additional && UUIDRef == selectionRef.value) {
            // do not select the main as additional
            return;
        }

        if (!additional) {
            additionalSelectionUUIDs.value = new Set();
            emit("selected", uuid);
        } else {
            if (additionalSelectionUUIDs.value.has(uuid)) {
                additionalSelectionUUIDs.value.delete(uuid);
                unselect = true;
            } else {
                additionalSelectionUUIDs.value.add(uuid);
                unselect = false;
            }
            emit("selected-additional", Array.from(additionalSelectionUUIDs.value));
        }

        // do not double select
        if (!additional || UUIDRef != selectionRef.value) {
            selectUUIDGraphically(UUIDRef, additional, unselect);
        }
    };

    const selectUUIDGraphically = (UUIDRef: string, additional: boolean = false, unselect: boolean = false) => {
        if (!additional) {
            selectionRef.value = UUIDRef;
            additionalSelectionRefs.value = new Set(); // de-select additional selections
        } else {
            if (!unselect) {
                additionalSelectionRefs.value.add(UUIDRef);
                // this is not 100% name-reflective... If graphically selected, make sure the additionalSelectionUUIDs cache also contains the uuid or mismatches will happen
                additionalSelectionUUIDs.value.add(Operator.UUIDFromUUIDRef(UUIDRef));
            } else {
                additionalSelectionRefs.value.delete(UUIDRef);
            }
        }
        updateBorders();
    };

    const postProcess = () => {
        props.uuidRefsToProcess.forEach((UUIDRef) => {
            const outer = document.getElementById(UUIDRef);
            if (outer) {
                outer.addEventListener("click", clickListenerWrapper(UUIDRef));
                outer.addEventListener("contextmenu", rightClickListenerWrapper(UUIDRef));
            }
        });

        updateBorders();
    };

    const updateBorders = () => {
        const container = document.getElementById(containerId.value);
        if (container) {
            // remove the border-class from all that have it
            const borderedElements = container.querySelectorAll(".border");
            borderedElements.forEach(function (element) {
                element.classList.remove("border");
            });
            // remove the red-border-class from all that have it
            const additionalBorderedElements = container.querySelectorAll(".red-border");
            additionalBorderedElements.forEach(function (element) {
                element.classList.remove("red-border");
            });

            // add the class only to the current container
            const selected = container.querySelector("#" + selectionRef.value);
            if (selected) {
                // add the border as selection indication
                selected.classList.add("border");

                // scroll the screen so this can be seen
                if (useRouteStore().mode != "help") {
                    selected.scrollIntoView({
                        inline: "center",
                        behavior: "smooth",
                        block: "nearest",
                    });
                }
            }
            additionalSelectionRefs.value.forEach((uuidRef) => {
                // add the additional-class only to the current container
                const additionalSelected = container.querySelector("#" + uuidRef);
                if (additionalSelected) {
                    // add the red-border as selection indication
                    additionalSelected.classList.add("red-border");
                }
            });
        }
    };

    const render = () => {
        const element = document.getElementById(containerId.value);

        if (element) {
            // empty
            element.replaceChildren();

            // render new content
            katex.render(props.katexInput, element, {
                macros: katexMacros,
                throwOnError: false,
                displayMode: true,
                trust: true,
                strict: false,
                output: "html",
                maxExpand: Infinity, // weak macro expansion limit to 1000. As my latex is computer generated, it SHOULD not have macro loops... So he said
            });
        }

        postProcess();
    };

    onBeforeMount(() => {
        selectFunctionStore.addSelectionHandlerToStore(props.rendererUuid, selectUUIDProgrammatically as any);
        selectFunctionStore.addGraphicalSelectionHandlerToStore(props.rendererUuid, selectUUIDGraphically as any);
    });

    onMounted(() => {
        render();
    });

    watch(props, () => {
        selectFunctionStore.addSelectionHandlerToStore(props.rendererUuid, selectUUIDProgrammatically as any);
        selectFunctionStore.addGraphicalSelectionHandlerToStore(props.rendererUuid, selectUUIDGraphically as any);
        render();
    });

    onBeforeUnmount(() => {
        selectFunctionStore.removeSelectionHandlerFromStore(props.rendererUuid);
        selectFunctionStore.removeGraphicalSelectionHandlerFromStore(props.rendererUuid);
    });
</script>

<template>
    <div :id="containerId" class="render-katex-custom"></div>
</template>
