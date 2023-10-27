<script setup lang="ts">
    import KatexRenderer from "./components/KatexRenderer.vue";
    import {
        BracketedSum,
        Numerical,
        Fraction,
        BigInt,
        RawLatex,
        Variable,
        StructuralVariable,
        BracketedMultiplication,
        BigSum,
        Operator,
        Negation,
    } from "./functions/operator";
    import { operatorFromString } from "./functions/parser";
    import { ref, computed } from "vue";

    const formula = ref(
        new BigSum(
            new RawLatex("n=0"),
            new RawLatex("100"),
            new BigInt(
                new Negation(new RawLatex("\\infty")),
                new RawLatex("\\infty"),
                new BracketedSum([
                    new Numerical(123),
                    new Fraction(
                        new BracketedMultiplication([new StructuralVariable("A", new Numerical(1)), new Numerical(4)]),
                        new Numerical(100)
                    ),
                ]),
                new Variable("x")
            )
        )
    );

    const exported = computed(() => {
        return formula.value.serializeStructure();
    });

    const reImported = computed(() => {
        return Operator.generateStructure(exported.value);
    });

    const text = ref("");
    const error = ref("");
    const parsedOperator = computed((): Operator | null => {
        error.value = "";

        let res = null;

        try {
            res = operatorFromString(text.value);
        } catch (err) {
            console.error(err);
            error.value = String(err);
        }

        return res;
    });
</script>

<template>
    <p>Try: <pre>sum(n=0 100 int(-\infty \infty (123+(A*4)/100) x))</pre></p>
    <input type="text" name="test" id="test" v-model="text" />
    <KatexRenderer
        v-if="parsedOperator"
        :katex-input="parsedOperator.getFormulaString()"
        :uuids-to-process="parsedOperator.getContainedUUIDs()"
        @selected="(id) => console.log(id)"
    />
    {{ error }}

    <KatexRenderer
        :katex-input="formula.getFormulaString()"
        :uuids-to-process="formula.getContainedUUIDs()"
        @selected="(id) => console.log(id)"
    />
    {{ formula.getFormulaString() }}
    <br />
    <br />
    {{ formula.exportFormulaString() }}
    <br />
    <br />
    {{ exported }}

    <KatexRenderer
        :katex-input="reImported.getFormulaString()"
        :uuids-to-process="reImported.getContainedUUIDs()"
        @selected="(id) => console.log(id)"
    />
    {{ reImported.getFormulaString() }}
    <br />
    <br />
    {{ formula.exportFormulaString() == reImported.exportFormulaString() ? "exports match" : "exports do not match" }}
</template>

<style scoped></style>
