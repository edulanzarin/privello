import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: "node",
        include: [
            "src/**/*.{test,pbt}.ts",
            "*.{test,pbt}.ts",
            "tests/**/*.{test,pbt}.ts",
        ],
        exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/lib/**/*.ts"],
            exclude: ["src/lib/**/*.test.ts", "src/lib/**/*.pbt.ts"],
        },
    },
});
