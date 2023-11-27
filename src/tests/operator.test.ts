import { beforeEach, describe, expect, test, jest } from "@jest/globals";
jest.useFakeTimers();
import mockPinia from "./setupPiniaForTesting";
import {
    BigSum,
    BracketedMultiplication,
    BracketedSum,
    Fraction,
    Negation,
    Numerical,
    RawLatex,
    Variable,
    BigInt,
    Bra,
    OperatorType,
    Operator,
    operatorFromString,
    generateOperatorConfig,
} from "../functions";

describe("operator module", () => {
    beforeEach(() => {
        mockPinia();
    });
    const testConfig = generateOperatorConfig();

    test("Too few operator children", () => {
        expect(() => new BracketedSum(testConfig, [])).toThrow();
    });

    const complexExample = () => {
        const formula = new BigSum(
            testConfig,
            new RawLatex(testConfig, "n=0"),
            new RawLatex(testConfig, "100"),
            new BigInt(
                testConfig,
                new Negation(testConfig, new RawLatex(testConfig, "\\infty")),
                new Bra(testConfig, new Numerical(testConfig, 1.2)),
                new BracketedSum(testConfig, [
                    new Numerical(testConfig, 123),
                    new Fraction(
                        testConfig,
                        new BracketedMultiplication(testConfig, [new Numerical(testConfig, 1), new Numerical(testConfig, 4)]),
                        new Numerical(testConfig, 100)
                    ),
                ]),
                new Variable(testConfig, "x")
            )
        );

        return formula;
    };

    test("Maximum complexity equation poster rendering", () => {
        expect(complexExample).not.toThrow();
        expect(complexExample().getExportFormulaString()).toEqual(
            "\\sum\\limits_{{n=0} }^{ {100}}\\int\\limits_{-{\\infty}}^{\\left\\lang1.2\\right\\vert}\\left(123+\\frac{\\left(1 \\cdot 4\\right)}{100}\\right)\\mathrm{d}{x}"
        );
    });

    test("Stringificated export and re-import", () => {
        const formula = complexExample();
        const serializedString = formula.getSerializedStructure();
        const reImportedFormula = Operator.generateStructure(testConfig, serializedString, true);
        const serializedString2 = reImportedFormula.getSerializedStructure();
        const clonedFormula = Operator.generateStructure(testConfig, serializedString, false);
        const serializedString3 = clonedFormula.getSerializedStructure();

        expect(serializedString).toBe(serializedString2);
        expect(serializedString).not.toBe(serializedString3);
    });

    test("Check QM Operators do not get implied multiplications rendered", () => {
        const input = "a  2 bra(psi) ket(phi) braket(2 3) bracket(1 2 3) 2 3 c n c#(n-1) b 1 b# 3 2";
        expect(() => operatorFromString(testConfig, input)).not.toThrow();
        expect(operatorFromString(testConfig, input).getExportFormulaString()).toBe(
            "\\left({a} \\cdot 2\\left\\lang\\Psi\\right\\vert\\left\\vert\\Phi\\right\\rang\\left\\lang2\\middle\\vert3\\right\\rang\\left\\lang1\\middle\\vert2\\middle\\vert3\\right\\rang2 \\cdot 3 \\cdot \\mathrm{c}_{{n}}\\mathrm{c}^\\dagger_{\\left({n}-1\\right)}\\mathrm{b}_{1}\\mathrm{b}^\\dagger_{3} \\cdot 2\\right)"
        );
        expect(operatorFromString(testConfig, input).getExportFormulaString(true)).toBe(
            "\\left({a} \\cdot 2 \\cdot \\left\\lang\\Psi\\right\\vert \\cdot \\left\\vert\\Phi\\right\\rang \\cdot \\left\\lang2\\middle\\vert3\\right\\rang \\cdot \\left\\lang1\\middle\\vert2\\middle\\vert3\\right\\rang \\cdot 2 \\cdot 3 \\cdot \\mathrm{c}_{{n}} \\cdot \\mathrm{c}^\\dagger_{\\left({n}+-1\\right)} \\cdot \\mathrm{b}_{1} \\cdot \\mathrm{b}^\\dagger_{3} \\cdot 2\\right)"
        );
    });

    test("Manual uuid setting", () => {
        const op = operatorFromString(testConfig, "a");
        expect(op.getFormulaString()).not.toBe("\\htmlId{ref_d2039287-3a4a-48c0-87f3-7560beaa9ab1}{{a}}");
        op.manuallySetUUID("d2039287-3a4a-48c0-87f3-7560beaa9ab1");
        expect(op.getFormulaString()).toBe("\\htmlId{ref_d2039287-3a4a-48c0-87f3-7560beaa9ab1}{{a}}");
        expect(op.getType()).toBe(OperatorType.Variable);
    });

    test("Skipping implied symbols", () => {
        expect(operatorFromString(testConfig, "bra(2)ket(2)").getExportFormulaString()).toBe(
            "\\left\\lang2\\right\\vert\\left\\vert2\\right\\rang"
        );
        expect(operatorFromString(testConfig, "5-3").getExportFormulaString()).toBe("\\left(5-3\\right)");
        expect(operatorFromString(testConfig, "5-3").getExportFormulaString(true)).toBe("\\left(5+-3\\right)");
    });

    test("All uuids exported", () => {
        const op = operatorFromString(testConfig, "23*4+1 sum(pi inf/1 a)");
        const uuids = op.getContainedUUIDRefs();
        const latexText = op.getFormulaString();

        uuids.forEach((uuid) => {
            expect(latexText).toContain(uuid);
        });
    });

    test("Reconstruct from wrong number of children", () => {
        expect(() =>
            Operator.generateStructure(
                testConfig,
                JSON.stringify({
                    type: "big_sum",
                    value: "",
                    children: [],
                    uuid: "ed28a50b-1316-4859-b510-7676e3f45015",
                })
            )
        ).toThrow();
        expect(() =>
            Operator.generateStructure(
                testConfig,
                JSON.stringify({
                    type: "big_sum",
                    value: "",
                    uuid: "ed28a50b-1316-4859-b510-7676e3f45015",
                })
            )
        ).toThrow();
    });
});
